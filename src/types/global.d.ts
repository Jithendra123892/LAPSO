/// <reference types="react" />
/// <reference types="react-dom" />
import 'leaflet/dist/leaflet.css'
import { Server as SocketIOServer } from 'socket.io'

declare global {
  var lapsIO: SocketIOServer | undefined
}