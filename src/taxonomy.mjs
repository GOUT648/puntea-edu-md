export const roles = {
  elev: 'Elev',
  profesor: 'Profesor',
  scoala: 'Școală',
  companie: 'Companie',
}

export const audiences = {
  toti: 'Toți',
  elevi: 'Elevi',
  profesori: 'Profesori',
  scoli: 'Școli',
  companii: 'Companii',
}

export const categories = {
  formari: 'Cursuri',
  concursuri: 'Concursuri',
  comunitati: 'Comunități',
  evenimente: 'Evenimente',
  finantari: 'Granturi',
  proiecte: 'Proiecte',
  mentorat: 'Mentorat',
  cercetari: 'Cercetări',
  resurse: 'Resurse',
  activitati: 'Activități',
}
export const mainCategories = ['formari', 'concursuri', 'comunitati', 'evenimente', 'finantari', 'proiecte', 'resurse']

export const kindToCategory = {
  Concurs: 'concursuri',
  Formare: 'formari',
  Mentorat: 'mentorat',
  Comunitate: 'comunitati',
  Finanțare: 'finantari',
  Plan: 'resurse',
  Program: 'activitati',
}

export const audienceKeys = { Elevi: 'elevi', Profesori: 'profesori', Școli: 'scoli' }
export const postTypes = { anunt: 'Anunț', cercetare: 'Cercetare', sprijin: 'Cerere de sprijin' }
export const fold = value => value.normalize('NFD').replace(/\p{Mark}/gu, '').toLocaleLowerCase('ro-MD')
