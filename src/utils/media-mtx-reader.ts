export interface MediaMTXConf {
  url: string;
  user?: string;
  pass?: string;
  token?: string;
  onError?: (err: string) => void;
  onTrack?: (evt: RTCTrackEvent) => void;
  onDataChannel?: (evt: RTCDataChannelEvent) => void;
}

export class MediaMTXWebRTCReader {
  private conf: MediaMTXConf;
  private state: 'getting_codecs' | 'running' | 'restarting' | 'failed' | 'closed' = 'getting_codecs';
  private pc: RTCPeerConnection | null = null;
  private restartTimeout: number | null = null;
  private offerData: any = null;
  private sessionUrl: string | null = null;
  private queuedCandidates: RTCIceCandidateInit[] = [];
  private nonAdvertisedCodecs: string[] = [];
  private retryPause = 2000;

  constructor(conf: MediaMTXConf) {
    this.conf = conf;
    this.getNonAdvertisedCodecs();
  }

  public close() {
    this.state = 'closed';

    if (this.pc !== null) {
      try {
        this.pc.close();
      } catch (e) {
        console.warn("Error closing RTCPeerConnection:", e);
      }
      this.pc = null;
    }

    if (this.restartTimeout !== null) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }
  }

  private static supportsNonAdvertisedCodec(codec: string, fmtp?: string): Promise<boolean> {
    return new Promise((resolve) => {
      const pc = new RTCPeerConnection({ iceServers: [] });
      const mediaType = 'audio';
      let payloadType = '';

      pc.addTransceiver(mediaType, { direction: 'recvonly' });
      pc.createOffer()
        .then((offer) => {
          if (!offer.sdp) {
            throw new Error('SDP not present');
          }
          if (offer.sdp.includes(` ${codec}`)) {
            throw new Error('already present');
          }

          const sections = offer.sdp.split(`m=${mediaType}`);
          const payloadTypes = sections.slice(1)
            .map((s) => s.split('\r\n')[0].split(' ').slice(3))
            .reduce((prev, cur) => [...prev, ...cur], []);
          payloadType = this.reservePayloadType(payloadTypes);

          const lines = sections[1].split('\r\n');
          lines[0] += ` ${payloadType}`;
          lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} ${codec}`);
          if (fmtp !== undefined) {
            lines.splice(lines.length - 1, 0, `a=fmtp:${payloadType} ${fmtp}`);
          }
          sections[1] = lines.join('\r\n');
          offer.sdp = sections.join(`m=${mediaType}`);
          return pc.setLocalDescription(offer);
        })
        .then(() => (
          pc.setRemoteDescription(new RTCSessionDescription({
            type: 'answer',
            sdp: 'v=0\r\n'
            + 'o=- 6539324223450680508 0 IN IP4 0.0.0.0\r\n'
            + 's=-\r\n'
            + 't=0 0\r\n'
            + 'a=fingerprint:sha-256 0D:9F:78:15:42:B5:4B:E6:E2:94:3E:5B:37:78:E1:4B:54:59:A3:36:3A:E5:05:EB:27:EE:8F:D2:2D:41:29:25\r\n'
            + `m=${mediaType} 9 UDP/TLS/RTP/SAVPF ${payloadType}\r\n`
            + 'c=IN IP4 0.0.0.0\r\n'
            + 'a=ice-pwd:7c3bf4770007e7432ee4ea4d697db675\r\n'
            + 'a=ice-ufrag:29e036dc\r\n'
            + 'a=sendonly\r\n'
            + 'a=rtcp-mux\r\n'
            + `a=rtpmap:${payloadType} ${codec}\r\n`
            + ((fmtp !== undefined) ? `a=fmtp:${payloadType} ${fmtp}\r\n` : ''),
          }))
        ))
        .then(() => resolve(true))
        .catch(() => resolve(false))
        .finally(() => pc.close());
    });
  }

  private static unquoteCredential(v: string): string {
    try {
      return JSON.parse(`"${v}"`);
    } catch {
      return v;
    }
  }

  private static linkToIceServers(links: string | null): RTCIceServer[] {
    if (!links) return [];
    return links.split(', ').map((link) => {
      const m = link.match(/^<(.+?)>; rel="ice-server"(; username="(.*?)"; credential="(.*?)"; credential-type="password")?/i);
      if (!m) return { urls: [link] };
      const ret: RTCIceServer = { urls: [m[1]] };
      if (m[3] !== undefined) {
        ret.username = this.unquoteCredential(m[3]);
        ret.credential = this.unquoteCredential(m[4]);
        ret.credential = 'password';
      }
      return ret;
    });
  }

  private static parseOffer(sdp: string) {
    const ret = {
      iceUfrag: '',
      icePwd: '',
      medias: [] as string[],
    };

    for (const line of sdp.split('\r\n')) {
      if (line.startsWith('m=')) {
        ret.medias.push(line.slice('m='.length));
      } else if (ret.iceUfrag === '' && line.startsWith('a=ice-ufrag:')) {
        ret.iceUfrag = line.slice('a=ice-ufrag:'.length);
      } else if (ret.icePwd === '' && line.startsWith('a=ice-pwd:')) {
        ret.icePwd = line.slice('a=ice-pwd:'.length);
      }
    }

    return ret;
  }

  private static reservePayloadType(payloadTypes: string[]): string {
    for (let i = 30; i <= 127; i++) {
      if ((i <= 63 || i >= 96) && !payloadTypes.includes(i.toString())) {
        const pl = i.toString();
        payloadTypes.push(pl);
        return pl;
      }
    }
    throw new Error('unable to find a free payload type');
  }

  private static enableStereoPcmau(payloadTypes: string[], section: string): string {
    const lines = section.split('\r\n');
    let payloadType = this.reservePayloadType(payloadTypes);
    lines[0] += ` ${payloadType}`;
    lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} PCMU/8000/2`);
    lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);

    payloadType = this.reservePayloadType(payloadTypes);
    lines[0] += ` ${payloadType}`;
    lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} PCMA/8000/2`);
    lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);

    return lines.join('\r\n');
  }

  private static enableMultichannelOpus(payloadTypes: string[], section: string): string {
    const lines = section.split('\r\n');
    const configs = [
      'a=rtpmap:{PL} multiopus/48000/3\r\na=fmtp:{PL} channel_mapping=0,2,1;num_streams=2;coupled_streams=1',
      'a=rtpmap:{PL} multiopus/48000/4\r\na=fmtp:{PL} channel_mapping=0,1,2,3;num_streams=2;coupled_streams=2',
      'a=rtpmap:{PL} multiopus/48000/5\r\na=fmtp:{PL} channel_mapping=0,4,1,2,3;num_streams=3;coupled_streams=2',
      'a=rtpmap:{PL} multiopus/48000/6\r\na=fmtp:{PL} channel_mapping=0,4,1,2,3,5;num_streams=4;coupled_streams=2',
      'a=rtpmap:{PL} multiopus/48000/7\r\na=fmtp:{PL} channel_mapping=0,4,1,2,3,5,6;num_streams=4;coupled_streams=4',
      'a=rtpmap:{PL} multiopus/48000/8\r\na=fmtp:{PL} channel_mapping=0,6,1,4,5,2,3,7;num_streams=5;coupled_streams=4',
    ];

    for (const cfg of configs) {
      const payloadType = this.reservePayloadType(payloadTypes);
      lines[0] += ` ${payloadType}`;
      const expanded = cfg.replace(/{PL}/g, payloadType).split('\r\n');
      for (const line of expanded) {
        lines.splice(lines.length - 1, 0, line);
      }
      lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);
    }

    return lines.join('\r\n');
  }

  private static enableL16(payloadTypes: string[], section: string): string {
    const lines = section.split('\r\n');
    const rates = ['8000', '16000', '48000'];
    for (const rate of rates) {
      const payloadType = this.reservePayloadType(payloadTypes);
      lines[0] += ` ${payloadType}`;
      lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} L16/${rate}/2`);
      lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);
    }
    return lines.join('\r\n');
  }

  private static enableStereoOpus(section: string): string {
    let opusPayloadFormat = '';
    const lines = section.split('\r\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('a=rtpmap:') && lines[i].toLowerCase().includes('opus/')) {
        opusPayloadFormat = lines[i].slice('a=rtpmap:'.length).split(' ')[0];
        break;
      }
    }

    if (opusPayloadFormat === '') {
      return section;
    }

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(`a=fmtp:${opusPayloadFormat} `)) {
        if (!lines[i].includes('stereo')) {
          lines[i] += ';stereo=1';
        }
        if (!lines[i].includes('sprop-stereo')) {
          lines[i] += ';sprop-stereo=1';
        }
      }
    }

    return lines.join('\r\n');
  }

  private static editOffer(sdp: string, nonAdvertisedCodecs: string[]): string {
    const sections = sdp.split('m=');
    const payloadTypes = sections.slice(1)
      .map((s) => s.split('\r\n')[0].split(' ').slice(3))
      .reduce((prev, cur) => [...prev, ...cur], []);

    for (let i = 1; i < sections.length; i++) {
      if (sections[i].startsWith('audio')) {
        sections[i] = this.enableStereoOpus(sections[i]);
        if (nonAdvertisedCodecs.includes('pcma/8000/2')) {
          sections[i] = this.enableStereoPcmau(payloadTypes, sections[i]);
        }
        if (nonAdvertisedCodecs.includes('multiopus/48000/6')) {
          sections[i] = this.enableMultichannelOpus(payloadTypes, sections[i]);
        }
        if (nonAdvertisedCodecs.includes('L16/48000/2')) {
          sections[i] = this.enableL16(payloadTypes, sections[i]);
        }
        break;
      }
    }

    return sections.join('m=');
  }

  private static generateSdpFragment(od: any, candidates: RTCIceCandidateInit[]): string {
    const candidatesByMedia: Record<number, RTCIceCandidateInit[]> = {};
    for (const candidate of candidates) {
      const mid = candidate.sdpMLineIndex ?? 0;
      if (candidatesByMedia[mid] === undefined) {
        candidatesByMedia[mid] = [];
      }
      candidatesByMedia[mid].push(candidate);
    }

    let frag = `a=ice-ufrag:${od.iceUfrag}\r\n` + `a=ice-pwd:${od.icePwd}\r\n`;
    let mid = 0;

    for (const media of od.medias) {
      if (candidatesByMedia[mid] !== undefined) {
        frag += `m=${media}\r\n` + `a=mid:${mid}\r\n`;
        for (const candidate of candidatesByMedia[mid]) {
          frag += `a=${candidate.candidate}\r\n`;
        }
      }
      mid++;
    }

    return frag;
  }

  private handleError(err: string) {
    if (this.state === 'running') {
      if (this.pc !== null) {
        this.pc.close();
        this.pc = null;
      }
      this.offerData = null;

      if (this.sessionUrl !== null) {
        fetch(this.sessionUrl, { method: 'DELETE' }).catch(() => {});
        this.sessionUrl = null;
      }

      this.queuedCandidates = [];
      this.state = 'restarting';

      this.restartTimeout = window.setTimeout(() => {
        this.restartTimeout = null;
        this.state = 'running';
        this.start();
      }, this.retryPause);

      if (this.conf.onError) {
        this.conf.onError(`${err}, retrying in some seconds`);
      }
    } else if (this.state === 'getting_codecs') {
      this.state = 'failed';
      if (this.conf.onError) {
        this.conf.onError(err);
      }
    }
  }

  private getNonAdvertisedCodecs() {
    Promise.all([
      ['pcma/8000/2'],
      ['multiopus/48000/6', 'channel_mapping=0,4,1,2,3,5;num_streams=2;coupled_streams=2'],
      ['L16/48000/2'],
    ].map((c) => MediaMTXWebRTCReader.supportsNonAdvertisedCodec(c[0], c[1]).then((r) => (r ? c[0] : false))))
      .then((c) => c.filter((e): e is string => e !== false))
      .then((codecs) => {
        if (this.state !== 'getting_codecs') {
          throw new Error('closed');
        }
        this.nonAdvertisedCodecs = codecs;
        this.state = 'running';
        this.start();
      })
      .catch((err) => {
        this.handleError(String(err));
      });
  }

  private start() {
    this.requestICEServers()
      .then((iceServers) => this.setupPeerConnection(iceServers))
      .then((offer) => this.sendOffer(offer))
      .then((answer) => this.setAnswer(answer))
      .catch((err) => {
        this.handleError(String(err));
      });
  }

  private authHeader(): Record<string, string> {
    if (this.conf.user !== undefined && this.conf.user !== '') {
      const credentials = btoa(`${this.conf.user}:${this.conf.pass}`);
      return { Authorization: `Basic ${credentials}` };
    }
    if (this.conf.token !== undefined && this.conf.token !== '') {
      return { Authorization: `Bearer ${this.conf.token}` };
    }
    return {};
  }

  private requestICEServers(): Promise<RTCIceServer[]> {
    return fetch(this.conf.url, {
      method: 'OPTIONS',
      headers: {
        ...this.authHeader(),
      },
    }).then((res) => MediaMTXWebRTCReader.linkToIceServers(res.headers.get('Link')));
  }

  private setupPeerConnection(iceServers: RTCIceServer[]): Promise<string> {
    if (this.state !== 'running') {
      throw new Error('closed');
    }

    this.pc = new RTCPeerConnection({
      iceServers,
    });

    const direction = 'recvonly';
    this.pc.addTransceiver('video', { direction });
    this.pc.addTransceiver('audio', { direction });

    this.pc.createDataChannel('');

    this.pc.onicecandidate = (evt) => this.onLocalCandidate(evt);
    this.pc.onconnectionstatechange = () => this.onConnectionState();
    this.pc.ontrack = (evt) => this.onTrack(evt);
    this.pc.ondatachannel = (evt) => this.onDataChannel(evt);

    return this.pc.createOffer().then((offer) => {
      if (!offer.sdp) throw new Error('SDP empty');
      offer.sdp = MediaMTXWebRTCReader.editOffer(offer.sdp, this.nonAdvertisedCodecs);
      this.offerData = MediaMTXWebRTCReader.parseOffer(offer.sdp);

      return this.pc!.setLocalDescription(offer).then(() => offer.sdp!);
    });
  }

  private sendOffer(offer: string): Promise<string> {
    if (this.state !== 'running') {
      throw new Error('closed');
    }

    return fetch(this.conf.url, {
      method: 'POST',
      headers: {
        ...this.authHeader(),
        'Content-Type': 'application/sdp',
      },
      body: offer,
    }).then((res) => {
      switch (res.status) {
        case 201:
          break;
        case 404:
          throw new Error('stream not found');
        case 400:
          return res.json().then((e) => {
            throw new Error(e.error);
          });
        default:
          throw new Error(`bad status code ${res.status}`);
      }

      const locHeader = res.headers.get('location');
      if (locHeader) {
        this.sessionUrl = new URL(locHeader, this.conf.url).toString();
      }

      return res.text();
    });
  }

  private setAnswer(answer: string): Promise<void> {
    if (this.state !== 'running') {
      return Promise.resolve();
    }

    return this.pc!.setRemoteDescription(
      new RTCSessionDescription({
        type: 'answer',
        sdp: answer,
      })
    ).then(() => {
      if (this.state !== 'running') {
        return;
      }
      if (this.queuedCandidates.length !== 0) {
        this.sendLocalCandidates(this.queuedCandidates);
        this.queuedCandidates = [];
      }
    });
  }

  private onLocalCandidate(evt: RTCPeerConnectionIceEvent) {
    if (this.state !== 'running') return;
    if (evt.candidate !== null) {
      if (this.sessionUrl === null) {
        this.queuedCandidates.push(evt.candidate);
      } else {
        this.sendLocalCandidates([evt.candidate]);
      }
    }
  }

  private sendLocalCandidates(candidates: RTCIceCandidateInit[]) {
    if (!this.sessionUrl) return;
    fetch(this.sessionUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/trickle-ice-sdpfrag',
        'If-Match': '*',
      },
      body: MediaMTXWebRTCReader.generateSdpFragment(this.offerData, candidates),
    })
      .then((res) => {
        switch (res.status) {
          case 204:
            break;
          case 404:
            throw new Error('stream not found');
          default:
            throw new Error(`bad status code ${res.status}`);
        }
      })
      .catch((err) => {
        this.handleError(String(err));
      });
  }

  private onConnectionState() {
    if (this.state !== 'running' || !this.pc) return;
    if (this.pc.connectionState === 'failed' || this.pc.connectionState === 'closed') {
      this.handleError('peer connection closed');
    }
  }

  private onTrack(evt: RTCTrackEvent) {
    if (this.conf.onTrack) {
      this.conf.onTrack(evt);
    }
  }

  private onDataChannel(evt: RTCDataChannelEvent) {
    if (this.conf.onDataChannel) {
      this.conf.onDataChannel(evt);
    }
  }
}
