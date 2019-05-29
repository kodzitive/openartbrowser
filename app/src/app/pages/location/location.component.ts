import { Component, OnInit, OnDestroy } from '@angular/core';
import { DataService } from 'src/app/core/services/data.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Location, Artwork, EntityType } from 'src/app/shared/models/models';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-location',
  templateUrl: './location.component.html',
  styleUrls: ['./location.component.scss'],
})
export class LocationComponent implements OnInit, OnDestroy {
  /** use this to end subscription to url parameter in ngOnDestroy */
  private ngUnsubscribe = new Subject();

  /** The entity this page is about */
  location: Location = null;

  /** Related artworks */
  sliderItems: Artwork[] = [];

  /** Change collapse icon */
  collapseDown: boolean = true;

  constructor(private dataService: DataService, private route: ActivatedRoute) { }

  /** hook that is executed at component initialization */
  ngOnInit() {
    /** Extract the id of entity from URL params. */
    this.route.paramMap.pipe(takeUntil(this.ngUnsubscribe)).subscribe(async (params) => {
      const locationId = params.get('locationId');
      /** Use data service to fetch entity from database */
      this.location = (await this.dataService.findById<Location>(locationId, EntityType.LOCATION));
      this.sliderItems = await this.dataService.findArtworksByLocations([this.location.id]);
    });
  }

  toggleDetails() {
    this.collapseDown = !this.collapseDown;
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
