import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.css']
})
export class PersonComponent {
  firstName = '';

  constructor(private http: HttpClient) { }

  sendRequest() {
    this.http.get(`/api/Person?firstName=${this.firstName.trim()}`)
      .subscribe(response => {
        console.log(response);
      });
  }

}
