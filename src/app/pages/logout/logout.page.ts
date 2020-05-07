import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/auth';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.page.html',
  styleUrls: ['./logout.page.scss'],
})
export class LogoutPage implements OnInit {

  constructor(private router: Router, public afAuth: AngularFireAuth) { }

  ngOnInit() {
    this.afAuth.auth.signOut();
    this.router.navigateByUrl('/login')
  }
}
