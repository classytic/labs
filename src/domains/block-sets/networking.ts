/** GENERATED — real-schema networking authoring blocks. */
import { manifestToBlock } from '../../lab-def/to-block.js';
import ethernetPinout from '../networking/ethernet-pinout/manifest.js';
import layerEncapsulation from '../networking/layer-encapsulation/manifest.js';
import networkMedia from '../networking/network-media/manifest.js';
import packetJourney from '../networking/packet-journey/manifest.js';
import subnetBuilder from '../networking/subnet-builder/manifest.js';
import switchLearning from '../networking/switch-learning/manifest.js';
import vlanDesigner from '../networking/vlan-designer/manifest.js';
import vpnTunnel from '../networking/vpn-tunnel/manifest.js';

export const blocks = [ethernetPinout, layerEncapsulation, networkMedia, packetJourney, subnetBuilder, switchLearning, vlanDesigner, vpnTunnel].map(manifestToBlock);
