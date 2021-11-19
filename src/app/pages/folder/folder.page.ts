import { Component, OnInit, ViewEncapsulation, HostListener, ElementRef } from '@angular/core';
import { PopoverController, IonItemSliding } from '@ionic/angular';

import { Word } from '../../models/word.model';
import { WordService, Dico, dicoList } from '../../services/word.service';
import { FilterPopoverComponent } from './filter-popover/filter-popover.component';

import * as _ from 'lodash';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FolderPage implements OnInit {
  isActualView: boolean;

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Btn "Enter"
    if (event.keyCode === 13 && this.isActualView) {
      const selectedItem = this.refElement.nativeElement.querySelector('ion-item.ion-focused')
      if (selectedItem) {
        const attr = selectedItem.getAttribute('ng-reflect-router-link') || '';
        const splitAttr = attr.split(',');
        if (splitAttr.length == 2) {
          this.router.navigate([splitAttr[0], splitAttr[1]], { relativeTo: this.route });
        } else {
          this.router.navigate(['new', this.searchString], { relativeTo: this.route });
        }
      } else {
        this.router.navigate(['new', this.searchString], { relativeTo: this.route });
      }
    }
    // Esc
    if (event.keyCode === 27 && this.isActualView) {
      this.searchString = '';
    }
  }

  public displayedWords: Word[] = [];
  public searchString: string = '';
  public dico: Dico;

  private popover: HTMLIonPopoverElement;
  private destroy$: Subject<void> = new Subject();
  private refresh$: BehaviorSubject<void> = new BehaviorSubject(null);

  private isFilterRandom: boolean = false;
  private categoryFilter: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private wordService: WordService,
    private popoverController: PopoverController,
    private router: Router,
    private route: ActivatedRoute,
    private refElement: ElementRef
  ) {}

  async ngOnInit() {
    console.log('Page ngOnInit');
    const dicoName = this.activatedRoute.snapshot.paramMap.get('dicoName');
    this.dico = dicoList[dicoName];

    await this.wordService.initialise(this.dico);
    localStorage.setItem('folder', dicoName);

    combineLatest([this.wordService.words$, this.wordService.searchedWords$, this.wordService.randomWords$, this.refresh$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([words, searchWords, randomWords]) => {
        console.log('combineLatest', words, searchWords, randomWords);
        this.displayedWords = this.searchString ? searchWords : this.isFilterRandom ? randomWords : words;
        this.wordService.displayedWords = this.displayedWords;
      });
  }

  ngOnDestroy(): void {
    console.log('Page ngOnDestroy');
    this.destroy$.next();
    this.destroy$.complete();
  }

  ionViewWillEnter(){
    this.isActualView = true;
  }

  ionViewWillLeave(){
    this.isActualView = false;
  }

  trackByFn(index: number, item: Word) {
    return item.id;
  }

  async onFilterPopoverClick(ev: any) {
    this.popover = await this.popoverController.create({
      component: FilterPopoverComponent,
      componentProps: {
        isFilterRandom: this.isFilterRandom,
        categoryFilter: this.categoryFilter,
        dismiss: (isFilterRandom: boolean, categoryFilter: string) => {
          if (isFilterRandom && !this.isFilterRandom) {
            this.wordService.random$.next(null);
          }
          if (categoryFilter && this.categoryFilter !== categoryFilter) {
            this.wordService.category$.next(categoryFilter);
          }
          this.isFilterRandom = isFilterRandom;
          this.categoryFilter = categoryFilter;
          this.refresh$.next(null);
          this.popover.dismiss();
        },
      },
      event: ev,
      translucent: true,
    });
    return await this.popover.present();
  }

  onReloadClick() {
    this.wordService.random$.next(null);
  }

  onResetFilterClick() {
    this.categoryFilter = null;
    this.isFilterRandom = false;
    this.wordService.category$.next(null);
  }

  onSearchChange(event) {
    this.searchString = event.target.value || '';
    this.wordService.search$.next(this.searchString.toLowerCase());
  }

  onUpdateTime(item: Word, slidingItem: IonItemSliding) {
    slidingItem.close();
    this.wordService.updateWord(item);
  }

  onDelete(item: Word) {
    this.wordService.deleteWord(item.id);
  }

  focusSearchField() {
    console.log('Focus Search !!!!')
  }
}
