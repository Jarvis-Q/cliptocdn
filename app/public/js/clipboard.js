$(function() {
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                var csrftoken = getCookie('csrfToken');
                xhr.setRequestHeader('x-csrf-token', csrftoken);
            }
        }
    })

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    var $typeEl = $('#J_Type');
    var $diplayEl = $('#J_Display');
    var $template = $('#J_Template');
    var currentPaste;

    document.addEventListener('paste', function (e) {
        var clipboardData = e.clipboardData;
        // 是否存在黏贴内容
        if (!(clipboardData && clipboardData.items)) {
            return;
        }

        for (var i = 0, len = clipboardData.items.length; i < len; i++) {
            var item = clipboardData.items[i];

            if (item.kind == 'string' && item.type === 'text/plain') {
                item.getAsString(function (str) {
                    $typeEl.html('字符串');
                    $diplayEl.html(str);
                })
            } else if (item.kind === 'file') {
                var pasteFile = item.getAsFile();
                var reader = new FileReader();
                reader.onload = function (e) {
                    currentPaste = event.target.result;
                    $diplayEl.html($template.html().replace(/##imgBase64##/g, currentPaste));
                }
                reader.readAsDataURL(pasteFile);
                $typeEl.html('图片');
            }
            // var copy_content = clipboardData.getData('text/plain');
        }
    })

    $(document).delegate('#J_Copy', 'click', function () {
        function handler(event) {
            event.clipboardData.setData('text/plain', $('#J_ContentCopying').html());
            document.removeEventListener('copy', handler, true);
            event.preventDefault();
            alert('已复制到剪贴板');
        }
        document.addEventListener('copy', handler, true);
        document.execCommand('copy');
    })

    $(document).delegate('#J_Upload', 'click', function () {
        var formData = new FormData();
        var content = $('#J_ContentCopying').text();
        formData.append('clipimage', convertBase64ToBlob(content), 'clipimage.png');

        $.ajax({
            url: '/view/clipboardUpload',
            type: 'post',
            data: formData,
            processData: false,
            contentType: false,
            success: function (result) {
                if (result.status === 200) {
                    var cdnPrefix = `http://imgstore.zuimo.me/${result.data}`
                    $('#J_CdnLink').text(cdnPrefix);
                } else {
                    $('#J_CdnLink').text(result.message || '上传失败');
                    console.log(result);
                }
            }
        })
    })

    function convertBase64ToBlob(urlData) {
        // https://developer.mozilla.org/zh-CN/docs/Web/API/WindowBase64/atob
        var bytes = window.atob(urlData.split(',')[1]);
        var fileType = urlData.split(';')[0].slice(5);
        
        // 处理异常，将ascii码小于0的转换为大于0
        // ArrayBuffer 对象用来表示通用的、固定长度的原始二进制数据缓冲区。ArrayBuffer 不能直接操作，而是要通过类型数组对象或 DataView 对象来操作，它们会将缓冲区中的数据表示为特定的格式，并通过这些格式来读写缓冲区的内容。
        var ab = new ArrayBuffer(bytes.length);
        var ia = new Uint8Array(ab);
        var i = 0;
        for (; i < bytes.length; i++) {
            ia[i] = bytes.charCodeAt(i);
        }

        var blob = new Blob([ia], { type: fileType });
        blob.name = blob.filename = 'clipimage.png';
        return blob;
    }

    function getCookie (name) {
        var cookie = document.cookie;
        var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
        if (arr = cookie.match(reg)) {
            return unescape(arr[2]);
        } else {
            return null;
        }
    }
})