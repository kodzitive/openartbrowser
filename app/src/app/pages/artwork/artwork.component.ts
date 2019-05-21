import { Component, OnInit, OnDestroy } from '@angular/core';
import { Artwork, Entity } from 'src/app/shared/models/models';
import { takeUntil } from 'rxjs/operators';
import { DataService } from 'src/app/core/services/data.service';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import * as _ from "lodash";

/** interface for the tabs */
interface SliderTab {
  heading: string;
  items: Artwork[];
  icon: string;
  active: boolean;
}

@Component({
  selector: 'app-artwork',
  templateUrl: './artwork.component.html',
  styleUrls: ['./artwork.component.scss'],
})
export class ArtworkComponent implements OnInit, OnDestroy {

  /**
   * @description the entity this page is about.
   * @type {Artwork}
   * @memberof ArtworkComponent
   */
  artwork: Artwork = null;

  /**
   * @description to toggle details container.
   * initial as true (close).
   * @type {boolean}
   * @memberof ArtworkComponent
   */
  collapseDown: boolean = true;

  /**
   * @description to toggle common tags container.
   * initial as true (close).
   * @type {boolean}
   * @memberof ArtworkComponent
   */
  collapseDownTags: boolean = true;

  /**
   * @description to save the artwork item that is being hovered.
   * @type {Artwork}
   * @memberof ArtworkComponent
   */
  hoveredArtwork: Artwork = null;

  /**
   * @description for the tabs in slider/carousel.
   * @type {{ [key: string]: SliderTab }}
   * @memberof ArtworkComponent
   */
  artworkTabs: { [key: string]: SliderTab } = {
    all: {
      heading: 'All',
      items: [],
      icon: 'list-ul',
      active: true,
    },
    artist: {
      heading: 'Artist',
      items: [],
      icon: 'user',
      active: false,
    },
    location: {
      heading: 'Location',
      items: [],
      icon: 'archway',
      active: false,
    },
    genre: {
      heading: 'Genre',
      items: [],
      icon: 'tags',
      active: false,
    },
    movement: {
      heading: 'Movement',
      items: [],
      icon: 'wind',
      active: false,
    },
    material: {
      heading: 'Material',
      items: [],
      icon: 'scroll',
      active: false,
    },
    motif: {
      heading: 'Motif',
      items: [],
      icon: 'image',
      active: false,
    },
  };

<<<<<<< HEAD
=======
  /**
   * @description use this to end subscription to url parameter in ngOnDestroy
   * @private
   * @memberof ArtworkComponent
   */
  private ngUnsubscribe = new Subject();

  /**
   * @description to fetch object in the html.
   * @memberof ArtworkComponent
   */
  Object = Object;

>>>>>>> master
  constructor(private dataService: DataService, private route: ActivatedRoute) { }

  /**
   * @description hook that is executed at component initialization
   * @memberof ArtworkComponent
   */
  ngOnInit() {
    /** Extract the id of entity from URL params. */
    this.route.paramMap.pipe(takeUntil(this.ngUnsubscribe)).subscribe(async (params) => {
      const artworkId = params.get('artworkId');
      /** Use data service to fetch entity from database */
      this.artwork = (await this.dataService.findById(artworkId)) as Artwork;

<<<<<<< HEAD
      /* Count meta data to show more on load */
      this.countMetaData();
      if (this.metaNumber < 3)
        this.collapseDown = false;

      this.artworkTabs.artist.items = await this.dataService.findArtworksByArtists(
        this.artwork.creators.map((creator) => {
          return creator.id;
        })
      );
      this.artworkTabs.location.items = await this.dataService.findArtworksByLocations(
=======
      const artworksByLocation = await this.dataService.findArtworksByLocations(
>>>>>>> master
        this.artwork.locations.map((location) => {
          return location.id;
        })
      );
      const artworksByGenre = await this.dataService.findArtworksByGenres(
        this.artwork.genres.map((genre) => {
          return genre.id;
        })
      );
      const artworksByMovements = await this.dataService.findArtworksByMovements(
        this.artwork.movements.map((movement) => {
          return movement.id;
        })
      );
      const artworksByMaterial = await this.dataService.findArtworksByMaterials(
        this.artwork.materials.map((material) => {
          return material.id;
        })
      );
      const artworksByArtists = await this.dataService.findArtworksByArtists(
        this.artwork.creators.map((artist) => {
          return artist.id;
        })
      );
      const artworksByMotifs = await this.dataService.findArtworksByMotifs(
        this.artwork.depicts.map((motif) => {
          return motif.id;
        })
      );

      this.artworkTabs.location.items = artworksByLocation;
      this.artworkTabs.genre.items = artworksByGenre;
      this.artworkTabs.material.items = artworksByMaterial;
      this.artworkTabs.motif.items = artworksByMotifs;
      this.artworkTabs.artist.items = artworksByArtists;
      this.artworkTabs.movement.items = artworksByMovements;

      this.removeMainArtworkFromTabs();
      this.selectAllTabItems(10);
    });
  }

  /**
   * @description Hook that is called when a directive, pipe, or service is destroyed.
   * @memberof ArtworkComponent
   */
  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * @description makes sure that the artwork this page is about does not appear in slider 
   */
  removeMainArtworkFromTabs() {
    for (const key of Object.keys(this.artworkTabs)) {
      this.artworkTabs[key].items = this.artworkTabs[key].items.filter((artwork) => artwork.id !== this.artwork.id);
    }
  }

  /**
   * @description function to fetch items into 'all' tab from others. 
   * use Set to filter duplicates
   * param will determine how many times to loop the tabs
   * get a single artwork in each tab every time it loops (unless duplicate)
   * set var artworkTabs.all.items to this Set
   * @param {number} maxAmountFromEachTab
   * @memberof ArtworkComponent
   */
  selectAllTabItems(maxAmountFromEachTab: number): void {
    const items = new Map<string, Artwork>();
    for (let index = 0; index < maxAmountFromEachTab; index++) {
      for (const key of Object.keys(this.artworkTabs)) {
        if (key !== 'all' && this.artworkTabs[key].items && this.artworkTabs[key].items[index]) {
          items.set(this.artworkTabs[key].items[index].id, this.artworkTabs[key].items[index]);
        }
      }
    }
    this.artworkTabs.all.items = Array.from(items, ([key, value]) => value);
  }

  /**
   * @description function to toggle details container. 
   * @memberof ArtworkComponent
   */
  toggleDetails(): void {
    this.collapseDown = !this.collapseDown;
  }

<<<<<<< HEAD
  metaNumber: number = 0;

  countMetaData() {
    if (!_.isEmpty(this.artwork.genres))
      this.metaNumber++;
    if (!_.isEmpty(this.artwork.materials))
      this.metaNumber++;
    if (!_.isEmpty(this.artwork.movements))
      this.metaNumber++;
    if (!_.isEmpty(this.artwork.depicts))
      this.metaNumber++;
    if ((!_.isEmpty(this.artwork.height)) && (!_.isEmpty(this.artwork.width)))
      this.metaNumber++;
=======
  /**
   * @description function to toggle common tags container.
   * @memberof ArtworkComponent
   */
  toggleCommonTags(): void {
    this.collapseDownTags = !this.collapseDownTags;
  }

  /**
   * @description function to determine if a tab is not empty.
   * @param {string} key
   * @returns {boolean}
   * @memberof ArtworkComponent
   */
  showTab(key: string): boolean {
    if (this.artwork) {
      switch (key) {
        case 'all':
          return true;
        case 'artist':
          return this.artwork.creators.length > 0;
        case 'movement':
          return this.artwork.movements.length > 0;
        case 'genre':
          return this.artwork.genres.length > 0;
        case 'motif':
          return this.artwork.depicts.length > 0;
        case 'location':
          return this.artwork.locations.length > 0;
        case 'material':
          return this.artwork.materials.length > 0;
        default:
          return false;
      }
    }
>>>>>>> master
  }
}
