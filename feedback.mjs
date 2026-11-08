export const priorities = [
  ['Teste cu utilizatori reali', 'În caseta 7, toate cele șase module raportau verificări tehnice. Feedbackul cere probe cu profesori, formatori sau directori și rezultate pe care echipele le pot verifica.'],
  ['Dovezi din interviuri', 'Observațiile relevante din Notițe și din panoul de contribuții trebuie aduse în caseta 3, cu rolul participanților și numărul de răspunsuri. Mărturiile publice oferă context.'],
  ['O versiune asumată de fiecare grup', 'Canvas-ul și dosarul trebuie să descrie aceeași soluție. La M3, cele două variante erau o platformă pe durata unui an și un cerc de practică de 30 de zile pe canale existente.'],
  ['Un editor și o instituție gazdă', 'Echipele trebuie să stabilească cine verifică fișele și acordul utilizatorului, cine susține editorul și cum se acoperă costurile de operare.'],
  ['Feedback în circuitul comun', 'M6 avea un mecanism de răspuns motivat, dar schimbul de cazuri cu restul ecosistemului se făcea manual prin fișiere. Nouă dintre cele 17 legături ale modulului erau propuse sau în conflict.'],
  ['Un rol distinct pentru M4', 'M4 trebuie să arate cum se coordonează oferta pe o temă. Harta ofertelor, golurile de verificat și un traseu în trei pași pot completa fișa de catalog din M1.'],
]

export const modules = [
  {
    id: 'm1',
    title: 'Vizibilitatea oportunităților',
    stats: ['10 / 10', '16 / 16', '20 / 140', '15 / 21', 3, '0 / 26'],
    strengths: [
      'La momentul evaluării, catalogul avea 16 fișe cu surse, termene și căutare fără diacritice. Edițiile închise rămâneau în arhivă.',
      'Ținta propusă pentru pilot era măsurabilă: 4 din 5 profesori găsesc o ofertă potrivită și termenul în două minute.',
    ],
    gaps: [
      'Clarificați publicul principal, uniformizați numele Puntea Edu și completați casetele 1–3 cu observațiile din interviurile de la eveniment.',
      'Verificați că fiecare sarcină are o fișă potrivită în catalog și încercați traseul recomandărilor cu participanți.',
    ],
    next: 'Rugați trei profesori din alte module să găsească pe telefon o ofertă reală și termenul ei. Notați rezultatul ca n din N în caseta 7.',
  },
  {
    id: 'm2',
    title: 'Vizibilitatea expertizei',
    stats: ['10 / 10', '16 / 16', '41 / 8', '10 / 14', 2, '26 / 26'],
    strengths: [
      'Căutarea pornește de la o nevoie concretă și folosește ruta existentă de mentorat INEL.',
      'Profilul cere puține date, acordul titularului și posibilitatea de retragere. Grupul își asumase toate cele 26 de casete.',
    ],
    gaps: [
      'Aduceți în caseta 3 dovezile despre recomandări și acordul formatorilor. Precizați cine verifică profilurile și de ce ar participa un expert.',
      'Probați cererea unei școli și căutarea unui coleg din altă regiune. Confirmați cu M4 cum se semnalează temele fără expert disponibil.',
    ],
    next: 'Dați unui tester o problemă reală de școală, rugați-l să găsească sprijin și notați ce a ales și de ce.',
  },
  {
    id: 'm3',
    title: 'Comunități și continuitate',
    stats: ['10 / 10', '16 / 16', '6 / 79', '11 / 16', 0, '0 / 26'],
    strengths: [
      'Dosarul propune un schimb de zece minute și o fișă scurtă în zilele 7, 14 și 30, prin cercuri metodice și eTwinning.',
      'Ținta propusă este ca minimum 60% dintre cei înscriși să consemneze o practică aplicată până în ziua 30.',
    ],
    gaps: [
      'Aduceți canvas-ul și dosarul la aceeași versiune și explicați nevoia profesorului cu dovezi din interviuri.',
      'Completați calendarul anual și stabiliți cine facilitează comunitatea după grant și ce îi face pe membri să revină.',
    ],
    next: 'Alegeți în grup varianta pe care o puteți susține și actualizați casetele 4 și 6 înainte de test.',
  },
  {
    id: 'm4',
    title: 'Coordonare și trasee',
    stats: ['10 / 10', '16 / 16', '28 / 40', '9 / 18', 0, '0 / 26'],
    strengths: [
      'Un gol al ofertei se confirmă prin cel puțin două categorii de actori. Datele se verifică săptămânal, iar ofertele incerte se marchează pentru reconfirmare.',
      'Tema „CES și sarcini diferențiate” oferă un punct de pornire pentru verificarea unui gol concret.',
    ],
    gaps: [
      'Mutați accentul pe deciziile furnizorilor și ale instituțiilor care planifică formarea. Probele bazate pe o fișă de olimpiadă acopereau căutarea din M1.',
      'Construiți harta și traseul de formare, apoi clarificați legăturile cu M2 și M6.',
    ],
    next: 'Inventariați ofertele despre CES și sarcini diferențiate. Arătați cui se adresează, ce trebuie confirmat și cum alege un profesor în trei pași.',
  },
  {
    id: 'm5',
    title: 'Evidență și cercetare',
    stats: ['9 / 10', '16 / 16', '10 / 16', '9 / 12', 0, '0 / 25'],
    strengths: [
      'Fișa leagă ediția și reperul curricular de trei observații practice despre ce a încercat profesorul, ce a observat și ce schimbă.',
      'Autorul decide dacă partajează. Facilitatorul anonimizează fișa, iar doi recenzori o evaluează independent.',
    ],
    gaps: [
      'Completați problema din caseta 1 și susțineți afirmațiile din caseta 3 cu interviuri consemnate în Notițe.',
      'Rezervați loc pentru ce nu a funcționat și arătați cum ajunge fișa la un cercetător și cum răspunsul revine în școală.',
    ],
    next: 'Formulați problema în caseta 1 și invitați un profesor să completeze fișa pornind de la o activitate reală.',
  },
  {
    id: 'm6',
    title: 'Feedback și guvernanță',
    stats: ['10 / 10', '16 / 16', '23 / 9', '8 / 17', 1, '0 / 26'],
    strengths: [
      'Circuitul prevede un răspuns motivat și un pas următor pentru fiecare propunere, inclusiv când e amânată sau respinsă.',
      'Carta propune reprezentare regională, mandate prin rotație, declararea intereselor și reexaminarea deciziilor.',
    ],
    gaps: [
      'Aduceți carta de o pagină în caseta 9 și documentați direct problema răspunsului la feedback.',
      'Legați circuitul de fișa comună, stabiliți cine decide și folosiți o singură cale pentru corecturi.',
    ],
    next: 'Puneți carta în caseta 9 și încercați cu trei persoane circuitul complet, pornind de la o corectură reală găsită în M1.',
  },
]

const partial = ['parțial', 'parțial', 'parțial', 'parțial', 'parțial', 'parțial']

export const criteria = [
  ['Problema', 15, 'Canvas 1–3 · Notițe', ['parțial', 'parțial', 'parțial', 'parțial', 'nu', 'parțial']],
  ['Valoare', 15, 'Canvas 4 · Dosar 22 și 33', ['da', 'da', 'parțial', 'parțial', 'da', 'parțial']],
  ['Conectivitate', 15, 'Canvas 5 și 8 · Hartă', ['da', 'da', 'da', 'parțial', 'da', 'parțial']],
  ['Fezabilitate', 15, 'Dosar 25–28', ['da', 'da', 'da', 'parțial', 'da', 'parțial']],
  ['Participare', 10, 'Dosar 32–34', partial],
  ['Sustenabilitate', 10, 'Canvas 10 · Dosar 34 și 36–38', partial],
  ['Guvernanță', 10, 'Canvas 9 · Dosar 24', ['da', 'parțial', 'da', 'da', 'da', 'da']],
  ['Prototip și validare', 10, 'Canvas 6 și 7 · Dosar 28', partial],
]

export const actions = [
  ['Testați cu participanți din alte module', 'Verificați datele necesare fiecărei sarcini. Notați în caseta 7 câți au reușit din total, primul blocaj și o schimbare făcută după test.'],
  ['Aduceți dovezile în caseta 3', 'Consemnați observațiile relevante din Notițe și din panoul de contribuții, cu rolurile participanților și numărul de răspunsuri.'],
  ['Asumați o singură versiune', 'Aliniați casetele 1–3 din M1, 4 și 6 din M3, respectiv 3 și 5 din M6. Cereți grupului să își asume textele finale.'],
  ['Completați problema din M5', 'Formulați în caseta 1 ce se pierde atunci când experiențele de la clasă rămân fără context și observații verificabile.'],
  ['Stabiliți cine răspunde de editare', 'Scrieți în fila Comune cine verifică informația și acordul, cine susține rolul și ce resurse de operare sunt necesare.'],
  ['Construiți traseul M4', 'Mapați ofertele pentru „CES și sarcini diferențiate”, marcați ce rămâne de confirmat și testați alegerea în trei pași.'],
  ['Încercați circuitul M6', 'Puneți carta de o pagină în caseta 9 și urmăriți cu participanți o corectură reală, de la propunerea în M1 până la răspuns.'],
  ['Revizuiți harta legăturilor', 'Luați o decizie pentru legăturile propuse și în conflict, eliminați dublurile și numele din textele proiectate. Stabiliți dacă păstrați evaluarea formatorilor și ce reguli i se aplică.'],
  ['Porniți cu o singură ediție', 'Stabiliți ediția, partenerii și ordinea comună în caseta 10. În prima lună, M1, M2, M3 și M5 urmăresc traseul profesorului. În luna a doua, M4 și M6 folosesc datele agregate.'],
  ['Pregătiți prezentarea de șapte minute', 'Urmăriți un profesor de la anunț până la exemplul revenit în catalog, pe traseul M1 → M3 → M5 → M1. Fiecare modul arată contribuția proprie și rezultatul testului.'],
]
