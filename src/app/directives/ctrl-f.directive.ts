import { Directive, HostListener, ElementRef } from '@angular/core';


@Directive({
    selector: '[focusOnCmdF]'
})
export class FocusOnCmdFDetectorDirective {   
    constructor(private refElement: ElementRef) {
    }

    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
      if (event.getModifierState && event.getModifierState('Meta') && event.keyCode === 70) {
          this.refElement.nativeElement.getElementsByTagName('INPUT')[0].focus();
        }
    }
}