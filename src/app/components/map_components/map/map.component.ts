import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { MapService } from '../map.service';
import { MarkerService } from 'src/app/services/marker.service';
import { CoordinateModel } from 'src/app/models/coordinate.model';
import { thisMonth } from '@igniteui/material-icons-extended';
import { VehicleType } from 'src/app/models/vehicle.model';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements AfterViewInit {
  private map: any;
  private coordinates : CoordinateModel[] = [];
  private price! : number;
  private distance! : number;

  getMap(){
    return this.map;
  }

  setMap(newMap : any){
    this.map = newMap;
  }

  constructor(private mapService: MapService, private markerService: MarkerService) {
    this.listenToButtonClicks();
  }

  listenToButtonClicks() {
    this.markerService.getData().subscribe((res) => {
      if(res instanceof CoordinateModel){
        this.coordinates.push(res);
        if(this.coordinates.length == 2){
          this.createRoute(this.coordinates[0], this.coordinates[1]);
        } 
      }else if(Array.isArray(res)){
        this.price = res[0];
        this.distance = res[1];
      }else {
          this.addMarkers(res);
      }
    })
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [45.2396, 19.8227],
      zoom: 13,
    });

    const tiles = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );
    tiles.addTo(this.map);

    // this.search();
    // this.addMarker();
    // this.registerOnClick();
    // this.route();
  }

  search(): void {
    this.mapService.search('Strazilovska 19').subscribe({
      next: (result) => {
        console.log(result);
        L.marker([result[0].lat, result[0].lon])
          .addTo(this.map)
          .bindPopup('Pozdrav iz Strazilovske 19.')
          .openPopup();
      },
      error: () => {},
    });
  }

  registerOnClick(): void {
    this.map.on('click', (e: any) => {
      const coord = e.latlng;
      const lat = coord.lat;
      const lng = coord.lng;
      this.mapService.reverseSearch(lat, lng).subscribe((res) => {
        console.log(res.display_name);
      });
      console.log(
        'You clicked the map at latitude: ' + lat + ' and longitude: ' + lng
      );
      const mp = new L.Marker([lat, lng]).addTo(this.map);
      alert(mp.getLatLng());
    });
  }


  addMarkers(address: string) : void{
    this.markerService.placeMarkerOne(this.map, address);
  }

  createRoute(address1 : CoordinateModel, address2 : CoordinateModel) : void {
    this.markerService.connectMarkers(this.map, address1, address2);
  }

  calculateInfo(){
    
  }

  ngAfterViewInit(): void {
    let DefaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.6.0/dist/images/marker-icon.png',
    });

    L.Marker.prototype.options.icon = DefaultIcon;
    this.initMap();
    console.log(this.map);
  }
}
