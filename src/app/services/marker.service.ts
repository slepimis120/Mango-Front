import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { BehaviorSubject, Observable, retry, Subject, tap } from 'rxjs';
import { MarkerStep, MarkerType, startIcon, endIcon, currentLocationIcon } from '../constants/constants';

const BASE_NOMINATIM_URL: string = 'nominatim.openstreetmap.org';



@Injectable({
  providedIn: 'root'
})
export class MarkerService {
  private subject!: Subject<any>;
  private observable$!: Observable<any>;
  private addressSubject : BehaviorSubject<any>;
  private address$!:Observable<any>;

  constructor(private http: HttpClient) {
    this.subject = new Subject();
    this.observable$ = this.subject.asObservable();
    this.addressSubject = new BehaviorSubject<any>(null);
   }


  sendData(data: any) {
    this.subject.next(data);
  }

  clearData() {
    this.subject.next(null);
  }

  getData(): Observable<any> {
    return this.observable$;
  }

  placeMarkerAddress(map: any, address: string, markerType : MarkerType) : void{
    let markerIcon = this.determineMarkerIcon(markerType);
    let url = `https://${BASE_NOMINATIM_URL}/search?format=json&q=${address}`;
    this.http.get(url).subscribe(async (res : any) =>{
      const lat = res[0].lat;
      const lon = res[0].lon;
      let marker = new L.Marker([lat, lon], {icon : markerIcon}).addTo(map);
      this.sendData({"step" : MarkerStep.ReturnMarker, "marker" : marker, "marker-type" : markerType});
    });
  }

  determineMarkerIcon(markerType : MarkerType) : L.Icon<L.IconOptions>{
    switch(markerType){
      case MarkerType.StartLocation: 
        return startIcon;
      case MarkerType.EndLocation:
        return endIcon;
      case MarkerType.CurrentLocation:
        return currentLocationIcon;
    }
  }

  connectMarkers(map: any, coordinate1 :L.LatLng, coordinate2 : L.LatLng) : void {
    let routing = L.Routing.control({
      waypoints: [
        L.latLng(coordinate1.lat, coordinate1.lng),
        L.latLng(coordinate2.lat, coordinate2.lng)
      ],
    }).addTo(map)
    this.sendData({"step" : MarkerStep.ReturnRoute, "route" : routing});
    routing.on('routesfound', (e) => {
      let routes = e.routes;
      let summary = routes[0].summary;  
      let distance = summary.totalDistance / 1000;
      let price = distance * 120;
      let duration = Math.round(summary.totalTime % 3600 / 60);
      this.sendData({
        "step" : MarkerStep.ReturnRideDetails,
        "price" : price,
        'duration' : duration,
        "distance" : distance});})
  }

  simulateMovement(start: L.LatLng, end: L.LatLng, map: L.Map) {
    let marker = L.marker(start);
    marker.addTo(map);
    let step = 0;
    let numSteps = 30; // number of steps to move from start to end
    let deltaLat = (end.lat - start.lat) / numSteps;
    let deltaLng = (end.lng - start.lng) / numSteps;

    let animation = setInterval(function() {
      marker.setLatLng([start.lat + (deltaLat * step), start.lng + (deltaLng * step)]);
      step++;
      if (step === numSteps) {
        clearInterval(animation);
      }
    }, 1000); // duration of each step in milliseconds

}

}



