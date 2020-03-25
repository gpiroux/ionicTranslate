import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Word } from '../models/word.model';
import { WordService } from '../firebase/word.service';
import { JoinPipe } from '../pipes/join.pipe'

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

  wordInit: any[];
  words: Word[] = [];
  orderValue: OrderBy = { key: 'date', direction: Direction.desc };

  constructor(private activatedRoute: ActivatedRoute, private wordService: WordService) { }

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id');

    console.log('ngOnInit');
    this.wordService.words$.subscribe(data => this.words = data);
  }

  onSearchChange(event) {
    let searchString = event.target.value;
    if (searchString.length == 0) {
      this.wordService.search$.next(null);
    } else if (searchString.length >= 3) {
      this.wordService.search$.next(event.target.value);
    }
  }

}
