const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/grafikon', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'grafikon.html'));
});

app.get('/slike', (req, res) => {
    const slike = [
        {
            file: 'At_Close_Range_poster.jpg',
            title: 'At Close Range',
            alt: 'Poster filma At Close Range'
        },
        {
            file: 'Diner-movie-poster-1982.jpg',
            title: 'Diner',
            alt: 'Poster filma Diner'
        },
        {
            file: 'Boweryatmidnight.jpg',
            title: 'Bowery at Midnight',
            alt: 'Poster filma Bowery at Midnight'
        },
        {
            file: 'Dead_bang_poster.jpg',
            title: 'Dead-Bang',
            alt: 'Poster filma Dead-Bang'
        },
        {
            file: 'ride a wild pony poster.jpg',
            title: 'Ride a Wild Pony',
            alt: 'Poster filma Ride a Wild Pony'
        },
        {
            file: 'Mr_Majestyk_movie_poster.jpg',
            title: 'Mr. Majestyk',
            alt: 'Poster filma Mr. Majestyk'
        }
    ];

    res.render('slike', { slike });
});

app.listen(PORT, () => {
    console.log(`Server radi na portu ${PORT}`);
});