import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { LaroussePage } from './larousse.page';

describe('LaroussePage', () => {
  let component: LaroussePage;
  let fixture: ComponentFixture<LaroussePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LaroussePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(LaroussePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
