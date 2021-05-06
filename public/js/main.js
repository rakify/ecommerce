console.log('working');

ClassicEditor
    .create(document.querySelector('#ck'))
    .catch(error => {
        console.error(error);
    });

