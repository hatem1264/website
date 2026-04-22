document.addEventListener('DOMContentLoaded', () => {
    const userCountElement = document.getElementById('user-count');

    // Exemple avec une API hypothétique ou un service de backend
    fetch('https://api.votre-service.com/online-users')
        .then(response => response.json())
        .then(data => {
            // On remplace le '--' par le chiffre réel
            userCountElement.textContent = data.count;
        })
        .catch(() => {
            userCountElement.textContent = '1'; // Valeur par défaut
        });
});