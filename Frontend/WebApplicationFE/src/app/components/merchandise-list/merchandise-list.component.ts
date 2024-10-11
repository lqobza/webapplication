import { Component, OnInit } from '@angular/core';
import { MerchandiseService } from '../../services/merchandise.service';
import { Merchandise } from '../../models/merchandise.model';

@Component({
  selector: 'app-merchandise-list',
  templateUrl: './merchandise-list.component.html',
  styleUrls: ['./merchandise-list.component.css']
})
export class MerchandiseListComponent implements OnInit {
  merchandiseList: Merchandise[] = [];

  constructor(private merchandiseService: MerchandiseService) { }

  ngOnInit(): void {
    console.log('MerchandiseListComponent initialized');
    this.loadMerchandise();
  }

  loadMerchandise(): void {
    this.merchandiseService.getAllMerchandise().subscribe(
      data => {
        console.log('Merchandise data received', data);
        this.merchandiseList = data;
      },
      error => console.error('Error fetching merchandise', error)
    );
  }
}
