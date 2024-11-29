import { Component } from '@angular/core';
import { HeadComponent } from "../header/head/head.component";
import { CategoryComponent } from "../category/category.component";
import { ProductListsComponent } from "../product-lists/product-lists.component";
import { MasterService } from '../services/master.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeadComponent, CategoryComponent, ProductListsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  getCategoryNameFromURL: any = "";
  searchTerm: any = "";


  constructor(private http: MasterService,private route: ActivatedRoute) {
    route.params.subscribe(val => {
      this.getCategoryNameFromURL = this.route.snapshot.paramMap.get("categoryName");
      this.searchTerm = this.route.snapshot.paramMap.get("query");
    });
  }
}
