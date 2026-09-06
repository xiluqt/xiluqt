#!/usr/bin/env python3
"""Real-data connectors for Xiluqt's offline-first learning pipeline.

Raw observations are cached locally. They are NOT automatically converted into
supervised labels; a shipment outcome or another validated target is required
before model weights are changed.
"""
from __future__ import annotations
import json,pathlib,time,urllib.parse,urllib.request
ROOT=pathlib.Path(__file__).resolve().parent
CACHE=ROOT/'cache';CACHE.mkdir(exist_ok=True)
HUBS={'lagos':(6.5244,3.3792),'singapore':(1.3521,103.8198),'dubai':(25.2048,55.2708)}
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'Xiluqt-OfflineBrain/1.0'})
    with urllib.request.urlopen(req,timeout=25) as r:return json.loads(r.read())
def weather():
    out={}
    for name,(lat,lon) in HUBS.items():
        q=urllib.parse.urlencode({'latitude':lat,'longitude':lon,'current':'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code','hourly':'precipitation_probability,visibility,wind_gusts_10m','forecast_days':2,'timezone':'UTC'})
        out[name]=get('https://api.open-meteo.com/v1/forecast?'+q)
    (CACHE/'weather.json').write_text(json.dumps({'fetched_at':time.time(),'data':out}));return out
def opensky():
    out={}
    for name,(lat,lon) in HUBS.items():
        q=urllib.parse.urlencode({'lamin':lat-2,'lamax':lat+2,'lomin':lon-2,'lomax':lon+2})
        try:out[name]=get('https://opensky-network.org/api/states/all?'+q)
        except Exception as e:out[name]={'error':type(e).__name__}
    (CACHE/'opensky.json').write_text(json.dumps({'fetched_at':time.time(),'data':out}));return out
def worldbank():
    out=get('https://api.worldbank.org/v2/country/NG/indicator/NY.GDP.MKTP.CD?format=json&per_page=5');(CACHE/'worldbank_ng.json').write_text(json.dumps({'fetched_at':time.time(),'data':out}));return out
def nasa_gibs():
    req=urllib.request.Request('https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/',headers={'User-Agent':'Xiluqt-OfflineBrain/1.0'})
    with urllib.request.urlopen(req,timeout=25) as r:raw=r.read(2_000_000)
    (CACHE/'nasa_gibs_metadata.json').write_bytes(raw);return len(raw)
def run():
    result={}
    for name,fn in [('weather',weather),('opensky',opensky),('worldbank',worldbank),('nasa_gibs',nasa_gibs)]:
        try:result[name]={'ok':True,'value':fn()}
        except Exception as e:result[name]={'ok':False,'error':type(e).__name__}
    (CACHE/'connector_run.json').write_text(json.dumps({'time':time.time(),'result':result},default=str,indent=2));print(json.dumps({k:v['ok'] for k,v in result.items()}))
if __name__=='__main__':run()
