import { Component, ElementRef, OnInit, Inject, PLATFORM_ID, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AppConstants } from './AppConstants';
import { MasterService } from './services/master.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [RouterOutlet],
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {

  // title = 'Angular-Estore';
  flakes: Flake[] = [];
  score: Score | null = null;
  interval: any = null;
  n = 60; // Number of flakes
  resizeTimeout: any;

  constructor(
    private elementRef: ElementRef,
    private masterService: MasterService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.onResize.bind(this)); // Add resize event listener
      this.build();
      this.run();
      this.score = new Score(this.platformId); // Initialize score
    }
  }

  setMetaTgs() {
    const data = AppConstants.metaURL;
  
      // Set SEO meta tags and page title
      this.masterService.setMetaTagsAndTitle(data,undefined);
  }

  ngAfterViewInit() {
    // Perform any DOM manipulation after the view is initialized
  }

  onResize() {
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      const { w, h } = this.getScreenSize();
      const maxX = w * 0.8; // 80% of screen width
      // Reset flakes' positions to avoid overflow on resize
      this.flakes.forEach(flake => {
        const x = Math.random() * maxX + w * 0.1; // Ensure flakes start within 80vw
        const y = Math.random() * (h * 0.8) + h * 0.1; // Starting between 10vh and 90vh
        flake.setPosition(x, y);
      });
    }, 200); // Throttle resize handling
  }

  getScreenSize() {
    return { w: window.innerWidth, h: window.innerHeight };
  }

  build() {
    if (isPlatformBrowser(this.platformId)) {
      const { w, h } = this.getScreenSize();
      const flakeSize = Math.min(w, h) * 0.01; // Reduce flake size (1% of screen dimension)
      const maxX = w * 0.8; // 80% of screen width
  
      for (let i = 0; i < this.n; i++) {
        const flake = new Flake(flakeSize); // Pass size to Flake constructor
        const x = Math.random() * maxX + w * 0.1; // Ensure flakes start within 80vw
        const y = Math.random() * (h * 0.8) + h * 0.1; // Starting between 10vh and 90vh
        flake.setPosition(x, y);
        this.flakes.push(flake);
        this.elementRef.nativeElement.appendChild(flake.nativeElement);
      }
    }
  }
  

  run() {
    if (isPlatformBrowser(this.platformId) && this.interval == null) {
      this.interval = window.setInterval(() => {
        if (this.flakes.length > 0) {
          this.flakes.forEach(flake => flake.move());
        }
      }, 50); // Move flakes every 50ms
    }
  }

  stop() {
    if (isPlatformBrowser(this.platformId) && this.interval != null) {
      window.clearInterval(this.interval);
      this.interval = null;
    }
  }
}

class Score {
  nativeElement: HTMLDivElement;

  constructor(private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.nativeElement = document.createElement('div');
      this.nativeElement.style.position = 'fixed';
      this.nativeElement.style.zIndex = '5000';
      this.nativeElement.style.top = '10px';
      this.nativeElement.style.left = '10px';
      this.nativeElement.style.fontSize = '36px';
      this.nativeElement.style.fontWeight = 'bold';
    } else {
      this.nativeElement = {} as HTMLDivElement; // Fallback for SSR
    }
  }

  disp(text: string) {
    if (isPlatformBrowser(this.platformId)) {
      this.nativeElement.innerText = text;
    }
  }
}

class Flake {
  nativeElement: HTMLElement;
  x: number = 0;
  y: number = 0;
  speed: number = 1;
  size: number = 5;

  constructor(size: number) {
    this.size = size; // Set the flake size dynamically
    this.nativeElement = document.createElement('div');
    this.nativeElement.classList.add('flake'); // Add a class for styling if needed
    this.nativeElement.style.position = 'absolute';
    this.nativeElement.style.width = `${this.size}px`; // Set width based on size
    this.nativeElement.style.height = `${this.size}px`; // Set height based on size
    this.nativeElement.style.backgroundColor = '#d0eceb'; // Set flake color
    this.nativeElement.style.borderRadius = '50%'; // Make it circular
    this.nativeElement.style.boxShadow = `0 0 ${this.size / 2}px rgba(255, 255, 255, 0.8)`; // Optional glow effect
    document.body.appendChild(this.nativeElement); // Append the flake to the body
  }


  setPosition(x: number, y: number) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Prevent flakes from overflowing the screen horizontally (within 80vw)
    this.x = Math.max(screenWidth * 0.1, Math.min(x, screenWidth * 0.9 - this.size)); // Ensure flakes stay within 80vw
    this.y = Math.max(screenHeight * 0.1, Math.min(y, screenHeight * 0.9)); // Set Y between 10vh and 90vh

    this.nativeElement.style.left = `${this.x}px`;
    this.nativeElement.style.top = `${this.y}px`;
  }

  move() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Move the flakes down vertically
    this.y += this.speed;

    // If the flake reaches the 90vh mark, reset its position to 10vh
    if (this.y > screenHeight * 0.9) {
      this.y = screenHeight * 0.1; // Reset to 10vh when reaching 90vh
    }

    // Prevent flakes from going beyond the left or right edge of the screen (80vw)
    if (this.x < screenWidth * 0.1) {
      this.x = screenWidth * 0.1; // Prevent moving beyond the left edge (10% of the screen width)
    } else if (this.x > screenWidth * 0.9 - this.size) {
      this.x = screenWidth * 0.9 - this.size; // Prevent moving beyond the right edge (90% of the screen width)
    }

    // Update the flake position
    this.nativeElement.style.left = `${this.x}px`;
    this.nativeElement.style.top = `${this.y}px`;
  }
 
}
