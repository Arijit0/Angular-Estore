import { Component, OnInit } from '@angular/core';
import { MasterService } from '../services/master.service';
import { Router } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-category',
    imports: [NgxSkeletonLoaderModule,CommonModule],
    templateUrl: './category.component.html',
    styleUrl: './category.component.css'
})
export class CategoryComponent implements OnInit{

  categories: any[] = [];
  categoryName: string = "";
  widthHeightSizeInPixels = 50;
  isCategory: boolean = false;

  constructor(private http: MasterService,private router: Router,private firestore: AngularFirestore,) {}

  ngOnInit(): void {
    this.getAllCategories();
  }


  getAllCategories() {

    setTimeout(() => {
      this.http.getCategories().subscribe({
        next: (data) => {
          this.categories = data;
          this.isCategory = true;
        }, error: (error) => {
          console.error('Error fetching products:', error);
        }
      })
    }, 1000);

  }

  getProductsBycategory(item: string) {
    this.categoryName = item;
    this.router.navigate([`/category/${this.categoryName}`],{queryParams:{categoryName: this.categoryName}});
  }
  
}
