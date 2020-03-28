
export class DicoWord {
    audio: string[] = [];
    en: string = '';
    phonetique: string = '';
    categorie: string = '';
    formeFlechie: string = '';

    traductions: Traduction[] = [];
    currentTraduction: Traduction = null;
    
    constructor(audio: string) {
        this.audio.push(audio);
    }

    initTraduction() {
        if (this.currentTraduction && !this.currentTraduction.traduction) {
            return 
        }
        this.currentTraduction = new Traduction()
        this.traductions.push(this.currentTraduction)
    }
}

export class Traduction {
    traduction: string = ''
    locution: string = ''
    indicateur: string = ''
    lien: string = ''
    tradList: Traduction[] = [];
}



// let result = [];
// let _audio = [];
// let _word = null;
// let _traduction = null;
// let _tradustion2 = null;

// let initWord = () => {
//     _word = {
//         audio: _audio,
//         categorie: '',
//         traductions: []
//     };
//     result.push(_word);
//     _traduction = null;
// }

// let initTraduction = () => {
//     _traduction = {
//         traduction: ''
//     };
//     _audio = [];
//     _word.traductions.push(_traduction);
// }