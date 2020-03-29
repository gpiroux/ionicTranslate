
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
        if (this.currentTraduction 
                && !this.currentTraduction.traduction
                && !this.currentTraduction.tradList.length) {
            return;
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