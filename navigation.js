document.addEventListener("DOMContentLoaded", function() {
    const content = document.getElementById('page-content');
    const navLinks = document.querySelectorAll('.sidebar nav a');

    function loadContent(url) {
        fetch(url)
            .then(response => response.text())
            .then(data => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(data, 'text/html');
                const newContent = doc.querySelector('.content').innerHTML;
                content.innerHTML = newContent;
            })
            .catch(error => console.error('Error loading page:', error));
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('href');
            history.pushState(null, '', url);
            loadContent(url);
        });
    });

    window.addEventListener('popstate', function() {
        loadContent(location.pathname);
    });
});
