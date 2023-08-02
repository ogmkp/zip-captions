import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Socket } from 'ngx-socket-io';
import { PeerActions } from '../../../actions/peer.actions';
import { Observable, Subject, shareReplay, take, timeout } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PeerService {

  private readonly SOCKET_URL: string;
  private readonly SOCKET_PORT: number;
  private readonly PEER_URL: string;
  private readonly PEER_PORT: number;
  private socket!: Socket;
  
  constructor(private store: Store) { 
    this.SOCKET_URL = process.env['ZIP_SOCKET_SERVER'] || 'localhost';
    this.SOCKET_PORT = process.env['ZIP_SOCKET_PORT'] ? Number(process.env['ZIP_SOCKET_PORT']) : 3000;
    this.PEER_URL = process.env['ZIP_PEER_SERVER'] || 'localhost';
    this.PEER_PORT = process.env['ZIP_PEER_PORT'] ? Number(process.env['ZIP_PEER_PORT']) : 9000;
  }

  connectSocket(): Observable<string> {
    this.socket = new Socket({url: `${this.SOCKET_URL}:${this.SOCKET_PORT}`})
    
    const sub = new Subject<string>();
    this.socket.on('connect', () => {
      console.log('connected', this.socket.ioSocket.id);
      sub.next(this.socket.ioSocket.id);
    });
    this.socket.on('message', (data: any) => {
      console.log('message', data);
      this.store.dispatch(PeerActions.socketServerMessageReceived(data));
    })
    return sub.asObservable().pipe(timeout(500), take(1));
  }

  disconnectSocket(): Observable<void> {
    const sub = new Subject<void>();
    this.socket.on('disconnect', () => {{
      console.log('disconnected');
      sub.next();
    }})
    this.socket.disconnect();
    return sub.asObservable().pipe(timeout(500), take(1));
  }

  joinRoom(data?: { room: string }) {
    const room: string = data?.room || this._generateRoomId();
    this.socket.emit('join', {room});
  }

  sendServerMessage(data: any) {
    this.socket.emit('message', data);
  }

  private _generateRoomId(): string {
    let outString = '';
    const outParts: string[] = [];
    const inOptions = 'abcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 3; i++) {
      outString = '';
      for (let j = 0; j < 4; j++) {
        outString += inOptions.charAt(Math.floor(Math.random() * inOptions.length));
      }
      outParts.push(outString);
    }
    return outParts.join('-');
  }
}
