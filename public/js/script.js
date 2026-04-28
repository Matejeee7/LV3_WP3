let sviNaslovi = [];
let prikazaniNaslovi = [];
let kosarica = JSON.parse(localStorage.getItem('kosaricaFilmova')) || [];

const elementi = {};

document.addEventListener('DOMContentLoaded', () => {
    elementi.tbodyPocetno = document.querySelector('#dinamicka-tablica tbody');
    elementi.tbodyRezultati = document.querySelector('#rezultati-tablica tbody');
    elementi.genre = document.getElementById('filter-zanr');
    elementi.naslov = document.getElementById('filter-naslov');
    elementi.godina = document.getElementById('filter-godina');
    elementi.godinaVrijednost = document.getElementById('godina-vrijednost');
    elementi.tipovi = document.querySelectorAll('input[name="filter-tip"]');
    elementi.sort = document.getElementById('sort-filmovi');
    elementi.brojRezultata = document.getElementById('broj-rezultata');
    elementi.listaKosarice = document.getElementById('lista-kosarice');
    elementi.brojKosarice = document.getElementById('broj-kosarice');
    elementi.poruka = document.getElementById('poruka-korisniku');

    const btnFiltriraj = document.getElementById('primijeni-filtere');
    const btnReset = document.getElementById('reset-filtera');
    const btnPotvrdi = document.getElementById('potvrdi-kosaricu');

    if (btnFiltriraj) btnFiltriraj.addEventListener('click', filtrirajNaslove);
    if (btnReset) btnReset.addEventListener('click', resetirajFiltere);
    if (btnPotvrdi) btnPotvrdi.addEventListener('click', potvrdiKosaricu);

    if (elementi.godina) {
        elementi.godina.addEventListener('input', () => {
            elementi.godinaVrijednost.textContent = elementi.godina.value;
            filtrirajNaslove();
        });
    }

    if (elementi.naslov) elementi.naslov.addEventListener('input', filtrirajNaslove);
    if (elementi.genre) elementi.genre.addEventListener('change', filtrirajNaslove);
    if (elementi.sort) elementi.sort.addEventListener('change', filtrirajNaslove);

    elementi.tipovi.forEach(radio => {
        radio.addEventListener('change', filtrirajNaslove);
    });

    ucitajPodatke();
    osvjeziKosaricu();
});

function ucitajPodatke() {
    fetch('/movies.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('CSV datoteka nije pronađena.');
            }
            return response.text();
        })
        .then(csv => {
            const rezultat = Papa.parse(csv, {
                header: true,
                skipEmptyLines: true
            });

            sviNaslovi = rezultat.data.map((redak, index) => {
                return {
                    id: String(index),
                    type: 'Movie',
                    title: redak.Naslov || 'Nepoznato',
                    year: Number(redak.Godina) || 0,
                    genre: redak.Zanr || 'Nije navedeno',
                    duration: redak.Trajanje_min ? `${redak.Trajanje_min} min` : 'Nije navedeno',
                    country: redak.Zemlja_porijekla
                        ? redak.Zemlja_porijekla.split('/').map(drzava => drzava.trim())
                        : ['Nije navedeno'],
                    rating: redak.Ocjena || 'Nije navedeno',
                    director: redak.Rezisery || 'Nije navedeno'
                };
            }).filter(naslov => naslov.year > 0);

            popuniZanrove();
            prikaziPocetneNaslove(sviNaslovi.slice(0, 20));
            filtrirajNaslove();
        })
        .catch(error => {
            console.error('Greška pri dohvaćanju CSV datoteke:', error);

            if (elementi.tbodyPocetno) {
                elementi.tbodyPocetno.innerHTML = `
                    <tr>
                        <td colspan="7">Podaci se nisu mogli učitati. Provjeri da je movies.csv u public mapi.</td>
                    </tr>
                `;
            }
        });
}

function popuniZanrove() {
    if (!elementi.genre) return;

    elementi.genre.innerHTML = '<option value="">Svi žanrovi</option>';

    const zanrovi = new Set();

    sviNaslovi.forEach(naslov => {
        naslov.genre.split(',').forEach(zanr => {
            if (zanr.trim() !== '') {
                zanrovi.add(zanr.trim());
            }
        });
    });

    [...zanrovi].sort().forEach(zanr => {
        const option = document.createElement('option');
        option.value = zanr;
        option.textContent = zanr;
        elementi.genre.appendChild(option);
    });
}

function prikaziPocetneNaslove(naslovi) {
    if (!elementi.tbodyPocetno) return;

    elementi.tbodyPocetno.innerHTML = '';

    naslovi.forEach(naslov => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${naslov.title}</td>
            <td>${naslov.year}</td>
            <td>${naslov.genre}</td>
            <td>${naslov.duration}</td>
            <td>${naslov.country.join(', ')}</td>
            <td>${naslov.rating}</td>
            <td>${naslov.type}</td>
        `;

        elementi.tbodyPocetno.appendChild(row);
    });
}

function filtrirajNaslove() {
    if (sviNaslovi.length === 0) return;

    const trazeniZanr = elementi.genre ? elementi.genre.value.toLowerCase() : '';
    const trazeniNaslov = elementi.naslov ? elementi.naslov.value.trim().toLowerCase() : '';
    const minimalnaGodina = elementi.godina ? Number(elementi.godina.value) : 0;

    const odabraniRadio = document.querySelector('input[name="filter-tip"]:checked');
    const odabraniTip = odabraniRadio ? odabraniRadio.value : 'Sve';

    prikazaniNaslovi = sviNaslovi.filter(naslov => {
        const odgovaraZanr =
            !trazeniZanr || naslov.genre.toLowerCase().includes(trazeniZanr);

        const odgovaraNaslov =
            !trazeniNaslov || naslov.title.toLowerCase().includes(trazeniNaslov);

        const odgovaraGodina =
            naslov.year >= minimalnaGodina;

        const odgovaraTip =
            odabraniTip === 'Sve' || naslov.type === odabraniTip;

        return odgovaraZanr && odgovaraNaslov && odgovaraGodina && odgovaraTip;
    });

    sortirajNaslove();
    prikaziFiltriraneNaslove(prikazaniNaslovi.slice(0, 80));
}

function sortirajNaslove() {
    const sort = elementi.sort ? elementi.sort.value : 'godina-silazno';

    prikazaniNaslovi.sort((a, b) => {
        if (sort === 'godina-uzlazno') {
            return a.year - b.year;
        }

        if (sort === 'naslov') {
            return a.title.localeCompare(b.title, 'hr');
        }

        return b.year - a.year;
    });
}

function prikaziFiltriraneNaslove(naslovi) {
    if (!elementi.tbodyRezultati) return;

    elementi.tbodyRezultati.innerHTML = '';

    if (elementi.brojRezultata) {
        elementi.brojRezultata.textContent =
            `Prikazano je ${naslovi.length} od ${prikazaniNaslovi.length} rezultata.`;
    }

    if (naslovi.length === 0) {
        elementi.tbodyRezultati.innerHTML = `
            <tr>
                <td colspan="8">Nema naslova za odabrane filtre.</td>
            </tr>
        `;
        return;
    }

    naslovi.forEach(naslov => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${naslov.title}</td>
            <td>${naslov.year}</td>
            <td>${naslov.genre}</td>
            <td>${naslov.duration}</td>
            <td>${naslov.country.join(', ')}</td>
            <td>${naslov.rating}</td>
            <td>${naslov.type}</td>
            <td>
                <button class="table-btn" data-id="${naslov.id}">
                    Dodaj u košaricu
                </button>
            </td>
        `;

        const button = row.querySelector('button');
        button.addEventListener('click', () => dodajUKosaricu(naslov.id));

        elementi.tbodyRezultati.appendChild(row);
    });
}

function dodajUKosaricu(id) {
    const naslov = sviNaslovi.find(item => item.id === id);

    if (!naslov) return;

    if (kosarica.some(item => item.id === id)) {
        prikaziPoruku('Ovaj naslov je već u košarici.', true);
        return;
    }

    kosarica.push(naslov);
    spremiKosaricu();
    osvjeziKosaricu();
    prikaziPoruku(`Dodano u košaricu: ${naslov.title}`);
}

function ukloniIzKosarice(id) {
    kosarica = kosarica.filter(item => item.id !== id);
    spremiKosaricu();
    osvjeziKosaricu();
}

function osvjeziKosaricu() {
    if (!elementi.listaKosarice || !elementi.brojKosarice) return;

    elementi.listaKosarice.innerHTML = '';
    elementi.brojKosarice.textContent = kosarica.length;

    if (kosarica.length === 0) {
        elementi.listaKosarice.innerHTML = '<li>Košarica je prazna.</li>';
        return;
    }

    kosarica.forEach(naslov => {
        const li = document.createElement('li');

        li.innerHTML = `
            <span>
                <strong>${naslov.title}</strong><br>
                ${naslov.year} | ${naslov.genre}
            </span>
            <button class="remove-btn" aria-label="Ukloni ${naslov.title}">
                Ukloni
            </button>
        `;

        li.querySelector('button').addEventListener('click', () => {
            ukloniIzKosarice(naslov.id);
        });

        elementi.listaKosarice.appendChild(li);
    });
}

function potvrdiKosaricu() {
    if (kosarica.length === 0) {
        prikaziPoruku('Košarica je prazna. Prvo dodajte barem jedan naslov.', true);
        return;
    }

    const broj = kosarica.length;

    kosarica = [];
    spremiKosaricu();
    osvjeziKosaricu();

    prikaziPoruku(
        `Uspješno ste dodali ${broj} naslova u svoju košaricu za vikend maraton!`
    );
}

function resetirajFiltere() {
    if (elementi.genre) elementi.genre.value = '';
    if (elementi.naslov) elementi.naslov.value = '';

    if (elementi.godina) {
        elementi.godina.value = 1940;
    }

    if (elementi.godinaVrijednost) {
        elementi.godinaVrijednost.textContent = '1940';
    }

    const radioSve = document.querySelector('input[name="filter-tip"][value="Sve"]');
    if (radioSve) radioSve.checked = true;

    if (elementi.sort) {
        elementi.sort.value = 'godina-silazno';
    }

    filtrirajNaslove();
}

function spremiKosaricu() {
    localStorage.setItem('kosaricaFilmova', JSON.stringify(kosarica));
}

function prikaziPoruku(tekst, greska = false) {
    if (!elementi.poruka) {
        alert(tekst);
        return;
    }

    elementi.poruka.textContent = tekst;
    elementi.poruka.className = greska ? 'message error' : 'message success';

    setTimeout(() => {
        elementi.poruka.textContent = '';
        elementi.poruka.className = 'message';
    }, 3500);
}