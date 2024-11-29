import { Component, Input, OnChanges } from '@angular/core';
import { MasterService } from '../services/master.service';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-product-lists',
    imports: [NgxSkeletonLoaderModule, CommonModule],
    templateUrl: './product-lists.component.html',
    styleUrl: './product-lists.component.css'
})
export class ProductListsComponent implements OnChanges {

  @Input() getCategoryNameFromURL: any;
  @Input() query: any;

  allProducts: any[] = [];
  isLoading = true;
  widthSizeInPixels = 300;
  HeightSizeInPixels = 300;
  isQueryMatched: boolean = false;

  constructor(private http: MasterService,private toastr: ToastrService, private router: Router) {}

  ngOnChanges(): void {
    this.allProductLists();
  }

  allProductLists() {
    this.isLoading = true;
    if(this.getCategoryNameFromURL) {
      this.http.getProductsByCategory(this.getCategoryNameFromURL).subscribe((res: any) => {
          this.allProducts = res;
          this.isLoading = false;
          // if(this.query){this.search();}
    })
    }else {
      this.isLoading = true;
      this.http.getAllProducts().subscribe((res: any) => {
        this.allProducts = res;
        this.isLoading = false;
        if(this.query){this.search();}
    })}
  }

  search() {
    this.isLoading = true;
    this.allProducts = this.allProducts.filter(item => 
      item.title.toLowerCase().includes(this.query.toLowerCase()) 
      || item.category.toLowerCase().includes(this.query.toLowerCase())
    );
    this.isLoading = false;
  }

  goToDetails(id: number,item: any) {
    this.router.navigate(['/products', id, item.title]);
    const newItem = { ...item, quantity: 1 };
    this.http.sendProductDetailsToLocalStorage(newItem);
  }

  addWishList() {
    this.toastr.error('Please login for wishlisting a product', 'Failed');
  }
}
