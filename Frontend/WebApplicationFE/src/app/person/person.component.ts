import { Component } from '@angular/core';
import { HttpClient, HttpHeaders   } from '@angular/common/http';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.css']
})
export class PersonComponent {
  firstName = '';
  address = '';
  constructor(private http: HttpClient) { }

  sendRequest() {
    this.http.get(`/api/Person?firstName=${this.firstName.trim()}`)
      .subscribe(response => {
        console.log(response);
      });
  }
  setAddress() {
    this.http.get(`/api/Person/update-address?address=${this.address.trim()}`).subscribe(
      response => {
        console.log('Address updated successfully:', response);
        // Handle success, e.g., show a success message
      },
      error => {
        console.error('Error updating address:', error);
        // Handle error, e.g., show an error message
      }
    );
  }
}
