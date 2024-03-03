import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-merchandise',
  templateUrl: './merchandise.component.html',
  styleUrls: ['./merchandise.component.css']
})
export class MerchandiseComponent {
  searchedMerch = '';

  constructor(private http: HttpClient) { }

  sendRequest() {
    this.http.get(`/api/merchandise`)
      .subscribe(response => {
        console.log(response);
      });
  }

  getAllMerchandise(){
    this.http.get(`/api/merchandise`)
      .subscribe(response => {
        console.log(response);
      })
  }
}
