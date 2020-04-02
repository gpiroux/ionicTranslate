import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Word } from '../../models/word.model';
import { WordService } from '../../services/word.service';

enum Direction {
  asc = 'asc',
  desc = 'desc'
}

interface OrderBy {
  key: string;
  direction: Direction; 
}

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss']
})
export class FolderPage implements OnInit {
  public folder: string;
  public words: Word[] = [];
  private searchString: string = '';

  constructor(
    private activatedRoute: ActivatedRoute, 
    private wordService: WordService
  ) { }

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id');

    console.log('ngOnInit');
    this.wordService.init()
    this.wordService.words$.subscribe(data => this.words = data);
  }

  onSearchChange(event) {
    this.searchString = event.target.value;
    if (this.searchString.length == 0) {
      this.wordService.search$.next(null);
    } else if (this.searchString.length >= 3) {
      this.wordService.search$.next(this.searchString.toLowerCase());
    }
  }

  onUpdateTime(item: Word) {
    Word.updateTimestamp(item);
    this.wordService.updateWord(item);
  }

  onDelete(item: Word) {
    this.wordService.deleteWord(item.id);
  }

}
