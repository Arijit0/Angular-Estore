import { Component, OnInit } from '@angular/core';
import { HeadComponent } from "../header/head/head.component";
import { CategoryComponent } from "../category/category.component";
import { ProductListsComponent } from "../product-lists/product-lists.component";
import { MasterService } from '../services/master.service';
import { ActivatedRoute } from '@angular/router';
import { AppConstants } from '../AppConstants'

@Component({
    selector: 'app-home',
    imports: [HeadComponent, CategoryComponent, ProductListsComponent],
    templateUrl: './home.component.html',
    styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit{

  getCategoryNameFromURL: any = "";
  searchTerm: any = "";

  constructor(private http: MasterService,private route: ActivatedRoute,private masterService: MasterService) {
      // Example data object with title, description, and image
  // const data = {
  //   title: 'Online Shopping India Mobile, Cameras, Lifestyle & more Online @ Flipkart.com',
  //   description: "India's biggest online store for Mobiles, Fashion (Clothes/Shoes), Electronics, Home Appliances, Books, Home, Furniture, Grocery, Jewelry, Sporting goods, Beauty & Personal Care and more! Find the largest selection from all brands at the lowest prices in India. Payment options - COD, EMI, Credit card, Debit card &amp; more.",
  //   image: 'https://static-assets-web.flixcart.com/batman-returns/batman-returns/p/images/logo_lite-cbb357.png'
  // };

    route.params.subscribe(val => {
      this.getCategoryNameFromURL = this.route.snapshot.paramMap.get("categoryName");
      this.searchTerm = this.route.snapshot.paramMap.get("query");
    });
  }
  ngOnInit(): void {
    this.setMetaTgs();
  }

  setMetaTgs() {
    const data = AppConstants.metaURL;
  
      // Set SEO meta tags and page title
      this.masterService.setMetaTagsAndTitle(data,undefined);
  }
}
