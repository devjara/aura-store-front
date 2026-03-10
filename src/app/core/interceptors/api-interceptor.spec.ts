import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { apiInterceptor } from './api-interceptor';
import { environment } from '@environments/environment.development';

describe('apiInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // Proveemos el cliente HTTP inyectando nuestro interceptor funcional
        provideHttpClient(withInterceptors([apiInterceptor])),
        // Proveemos el controlador de pruebas para mockear las llamadas
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    // Verificamos que no haya solicitudes pendientes
    httpMock.verify();
  });

  it('Debe inyectar ws_key y output_format si la url es del backend de prestashop', () => {
    httpClient.get(`${environment.apiUrl}/products`).subscribe();
    const req = httpMock.expectOne((request) => request.url.startsWith(environment.apiUrl));
    
    //Assertions de calidad
    expect(req.request.params.get('ws_key')).toBe(environment.apiKey);
    expect(req.request.params.get('output_format')).toBe('JSON');

    req.flush({}); // Respondemos con un objeto vacío para completar la solicitud
  });

  it('No debe modificar los parametros si la peticion va hacia una API externa', () => {
    const externalUrl = 'https://api.externa.com/datos';
    
    // Simulamos una llamada a una API cualquiera
    httpClient.get(externalUrl).subscribe();

    // Interceptamos la llamada
    const req = httpMock.expectOne(externalUrl);
    
    // Assertions: no debe tener nuestras llaves secretas
    expect(req.request.params.has('ws_key')).toBeFalsy();
    expect(req.request.params.has('output_format')).toBeFalsy();
    
    req.flush({});
  });
});
