import {
  AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild
} from '@angular/core';
import {interval, Observable, Subject} from 'rxjs';
import {SearchService} from 'src/app/core/services/search.service';
import {DataService} from 'src/app/core/services/elasticsearch/data.service';
import {Router} from '@angular/router';
import {debounceTime, switchMap, takeUntil} from 'rxjs/operators';
import {Entity, EntityType, TagItem} from '../../models/models';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  providers: [SearchService]
})
export class SearchComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('input', {static: false})
  inputRef: ElementRef;

  /** input for search component */
  searchInput: string;

  /** Array of all chips */
  searchItems: TagItem[] = [];

  /** whether search is header or home page */
  @Input()
  isHeaderSearch = false;

  /** Array of all placeholder values */
  placeholderArray: string[] = [
    '"Mona Lisa"',
    '"Vincent van Gogh"',
    '"Renaissance"',
  ];

  /** Counter of placeholderArray */
  counter = 0;

  /** simple check to prep tag for removal */
  rmTag = false;

  /** if set, search is only enabled by selecting from typeahead results */
  preventSearch = false;

  /** use this to end subscription to url parameter in ngOnDestroy */
  private ngUnsubscribe = new Subject();

  constructor(
    private dataService: DataService,
    private searchService: SearchService,
    private router: Router,
    private cdRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.searchService.$searchItems.pipe(takeUntil(this.ngUnsubscribe)).subscribe((items) => {
      this.searchItems = items;
    });
  }

  ngAfterViewInit() {
    this.placeholderArray.unshift(this.inputRef.nativeElement.placeholder);
    const inv = interval(8000);
    inv.pipe(takeUntil(this.ngUnsubscribe)).subscribe((val) => this.changePlaceholdertext());
    this.cdRef.detectChanges();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /** Change the text inside the placeholder */
  public changePlaceholdertext() {
    this.counter = ++this.counter % this.placeholderArray.length;
    this.inputRef.nativeElement.placeholder = this.placeholderArray[this.counter];
  }

  /**
   * @description basic type-ahead function for search bar.
   * This function get objects from data service,
   * sort objects and filter by criteria,
   * slice to return limited number of objects
   */
  formatter = (x: { name: string }) => x.name;

  /**
   * search for entities with specified search term
   * sort search results by relativeRank, type, position of the term within the search result.
   * select 10 out of all results that should be shown
   * @param text$: search term
   */
  public search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      switchMap(async (term) => {
        if (term === '') {
          return [];
        }
        let entities = await this.dataService.findByLabel(term.toLowerCase());
        entities = entities.filter((v) => v.label.toLowerCase().indexOf(term.toLowerCase()) > -1);

        // sort results by rank and modify rank by whether it starts with search term
        entities = this.sortSearchResultsByRank(entities, term);
        // select best results of each group
        entities = this.selectSearchResults(entities);
        // sort results again, after selection sorted them statically
        entities = this.sortSearchResultsByRank(entities, term);
        // group results by type, group with result of highest modified rank starts
        entities = this.groupSearchResultsByType(entities);

        return this.searchInput ? entities : [];
      })
    );

  /** sort search items by rank and whether results starts with search term
   * @param entities results which should be sorted
   */
  sortSearchResultsByRank(entities: Entity[], term: string): Entity[] {
    let sortedEntities = entities;
    sortedEntities.sort(
        (a, b): any => {
        let rankA = a.relativeRank;
        let rankB = b.relativeRank;
        const aPos = a.label.toLowerCase().indexOf(term.toLowerCase());
        const bPos = b.label.toLowerCase().indexOf(term.toLowerCase());

        // factor 2 for initial position
        if (aPos === 0) {
          rankA *= 2;
        }
        if (bPos === 0) {
          rankB *= 2;
        }
        // factor 0.5 for non-whitespace in front
        if (
          aPos > 0 &&
        a.label
        .toLowerCase()
        .charAt(aPos - 1)
        .match(/\S/)
        ) {
          rankA *= 0.5;
        }
        if (
        bPos > 0 &&
        b.label
        .toLowerCase()
        .charAt(bPos - 1)
        .match(/\S/)
        ) {
          rankA *= 0.5;
        }
        return rankB > rankA ? 1 : rankB < rankA ? -1 : 0;
      }
    );
    return sortedEntities;
  }


  /** select up to 10 results from entities, distributes over all categories
   * @param entities results out of which should be selected
   */
  selectSearchResults(entities: Entity[]): Entity[] {
    const artworks = [];
    const artists = [];
    const materials = [];
    const genre = [];
    const motifs = [];
    const movements = [];
    const locations = [];
    for (const ent of entities) {
      switch (ent.type) {
        case EntityType.ARTWORK: {
          artworks.push(ent);
          break;
        }
        case EntityType.ARTIST: {
          artists.push(ent);
          break;
        }
        case EntityType.MATERIAL: {
          materials.push(ent);
          break;
        }
        case EntityType.GENRE: {
          genre.push(ent);
          break;
        }
        case EntityType.MOTIF: {
          motifs.push(ent);
          break;
        }
        case EntityType.MOVEMENT: {
          movements.push(ent);
          break;
        }
        case EntityType.LOCATION: {
          locations.push(ent);
          break;
        }
      }
    }

    const newEntities = artworks
      .splice(0, 3)
      .concat(artists.splice(0, 3))
      .concat(materials.splice(0, 2))
      .concat(genre.splice(0, 2))
      .concat(motifs.splice(0, 2))
      .concat(movements.splice(0, 2))
      .concat(locations.splice(0, 2));

    let restItems = [];
    for (let i = 0; i < 10; ++i) {
      restItems = restItems
        .concat(artworks.splice(0, 1))
        .concat(artists.splice(0, 1))
        .concat(materials.splice(0, 1))
        .concat(genre.splice(0, 1))
        .concat(motifs.splice(0, 1))
        .concat(movements.splice(0, 1))
        .concat(locations.splice(0, 1));
    }
    return newEntities.concat(restItems).splice(0, 10);
  }

  /** resort search items so items of same type are grouped together
   * @param entities results which should be resorted
   */
  groupSearchResultsByType(entities: Entity[]): Entity[] {
    let types = [];
      entities.forEach(function (entity) {
        if (!types.includes(entity.type)) {
          types.push(entity.type);
        }
      });

    let entitiesResorted = [];
    types.forEach(function (type) {
      entities.forEach(function (entity) {
        if (entity.type == type) {
          entitiesResorted.push(entity);
        }
      });
    });
    return entitiesResorted;
  }

  /** build query params for search result url */
  buildQueryParams() {
    const params = {
      term: [],
      artist: [],
      motif: [],
      movement: [],
      genre: [],
      material: [],
      location: [],
    };
    for (const item of this.searchItems) {
      switch (item.type) {
        case EntityType.ARTIST: {
          params.artist.push(item.id);
          break;
        }
        case EntityType.MOVEMENT: {
          params.movement.push(item.id);
          break;
        }
        case EntityType.GENRE: {
          params.genre.push(item.id);
          break;
        }
        case EntityType.MATERIAL: {
          params.material.push(item.id);
          break;
        }
        case EntityType.MOTIF: {
          params.motif.push(item.id);
          break;
        }
        case EntityType.LOCATION: {
          params.location.push(item.id);
          break;
        }
        case null:
        case undefined: {
          params.term.push(item.label);
          break;
        }
      }
    }
    for (const key of Object.keys(params)) {
      if (params[key].length === 0) {
        delete params[key];
      }
    }
    return params;
  }

  /**
   * @description function called when selecting an item in type-ahead suggestions
   * if item is an artwork, redirect to artwork page.
   * else add add the item as chip and perform search.
   * prevent search via enter press for a duration of 300ms.
   * @param $event the selected entity from typeahead results
   */
  public async itemSelected($event) {
    this.preventSearch = true;
    setTimeout(() => {
      this.preventSearch = false;
    }, 300);

    this.searchInput = '';
    if ($event.item.type === EntityType.ARTWORK) {
      const url = `/artwork/${$event.item.id}`;
      $event.preventDefault();
      this.router.navigate([url]);
      return;
    } else {
      this.searchService.addSearchTag({
        label: $event.item.label,
        type: $event.item.type,
        id: $event.item.id,
      });
      $event.preventDefault();
    }
    this.performSearch();
  }

  /** perform search with the current chips.
   * if there is exactly one entity chip, redirect to that entity page.
   * if there is more than 1 chip or the chip is a term, redirect to search result page.
   **/
  performSearch() {
    if (this.searchItems.length === 0) {
      return;
    }
    const item = this.searchItems[0];
    if (this.searchItems.length === 1 && item.type) {
      let url = `/${item.type}/${item.id}`;
      this.router.navigate([url]);
      return;
    }
    this.router.navigate(['/search'], {queryParams: this.buildQueryParams()});
    return;
  }

  /** on enter press, if input is not empty add term to chips and
   * perform search.
   * If search is prevented due to a select event in the slider, do nothing because
   * event is already handled in itemSelected
   **/
  public searchTriggered() {
    if (this.preventSearch) {
      return;
    }
    if (this.searchInput) {
      this.searchService.addSearchTag({
        label: this.searchInput,
        type: null,
        id: null,
      });
    }
    this.performSearch();
    this.searchInput = '';
  }

  /** remove chip from search bar */
  public removeTag(item: TagItem) {
    this.searchService.removeSearchTag(item);
  }

  /**
   * @description get chips ready to be removed.
   * used to prevent backspace to accidentally delete all chips
   */
  public readyToRemove() {
    if (this.searchInput === '' && this.searchItems.length > 0) {
      this.rmTag = true;
    }
  }

  /** remove newest chip */
  public removeNewestTag() {
    if (this.searchInput === '' && this.rmTag) {
      this.searchService.removeSearchTag(this.searchItems[this.searchItems.length - 1]);
    }
    this.rmTag = false;
  }

  /** remove all chips */
  public clearAllTags() {
    this.searchService.clearSearchTags();
  }
}
