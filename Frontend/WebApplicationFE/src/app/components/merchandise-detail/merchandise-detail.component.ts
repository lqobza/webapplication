import { Component, OnInit, Input } from '@angular/core';
import { Merchandise } from '../../models/merchandise.model';

@Component({
  selector: 'app-merchandise-detail',
  templateUrl: './merchandise-detail.component.html',
  styleUrls: ['./merchandise-detail.component.css']
})
export class MerchandiseDetailComponent implements OnInit {
  @Input() merchandise!: Merchandise;

  constructor() { }

  ngOnInit(): void {
  }
}
