import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import apiService from '../services/api';

import WebSocketService from '../services/WebSocketService';

import {

  buildLiveGuardSignature,

  guardMovedMeaningfully,

  mapLiveLocationsApiResponse,

  mapOperationsGuardStatuses,

  mapRealtimeWsPayload,

  mergeLiveGuardMarkers,

} from '../utils/liveGuardLocationMapper';

import { LiveGuardMarker } from '../types/liveTracking.types';



interface UseLiveGuardLocationsOptions {

  enabled?: boolean;

  pollIntervalMs?: number;

  supplementalGuards?: Partial<LiveGuardMarker>[];

  /** Min ms between UI updates per guard (default 4000). */

  locationUpdateThrottleMs?: number;

}



export const useLiveGuardLocations = ({

  enabled = true,

  pollIntervalMs = 20000,

  supplementalGuards = [],

  locationUpdateThrottleMs = 4000,

}: UseLiveGuardLocationsOptions = {}) => {

  const [guards, setGuards] = useState<LiveGuardMarker[]>([]);

  const [loading, setLoading] = useState(true);

  const [isConnected, setIsConnected] = useState(false);



  const guardsRef = useRef<LiveGuardMarker[]>([]);

  const signatureRef = useRef('');

  const supplementalRef = useRef(supplementalGuards);

  const lastUpsertRef = useRef<Map<string, { ts: number; lat: number; lng: number }>>(

    new Map(),

  );



  supplementalRef.current = supplementalGuards;



  const supplementalKey = useMemo(

    () =>

      supplementalGuards

        .map((g) => `${g.guardId ?? ''}:${g.guardName ?? ''}:${g.userId ?? ''}`)

        .sort()

        .join('|'),

    [supplementalGuards],

  );



  const applyGuards = useCallback((next: LiveGuardMarker[]) => {

    const merged = mergeLiveGuardMarkers(next, supplementalRef.current);

    const signature = buildLiveGuardSignature(merged);

    if (signature === signatureRef.current) {

      return;

    }

    signatureRef.current = signature;

    guardsRef.current = merged;

    setGuards(merged);

  }, []);



  const upsertGuard = useCallback(

    (incoming: Partial<LiveGuardMarker> & { guardId: string }) => {

      if (

        typeof incoming.latitude !== 'number' ||

        typeof incoming.longitude !== 'number'

      ) {

        return;

      }



      const existing = guardsRef.current.find((g) => g.guardId === incoming.guardId);

      const now = Date.now();

      const last = lastUpsertRef.current.get(incoming.guardId);



      if (existing && last) {

        const moved = guardMovedMeaningfully(existing, incoming);

        if (!moved && now - last.ts < locationUpdateThrottleMs) {

          return;

        }

      } else if (last && now - last.ts < locationUpdateThrottleMs) {

        return;

      }



      lastUpsertRef.current.set(incoming.guardId, {

        ts: now,

        lat: incoming.latitude,

        lng: incoming.longitude,

      });



      const updated: LiveGuardMarker = {

        guardId: incoming.guardId,

        guardName: incoming.guardName || existing?.guardName || 'Guard',

        latitude: incoming.latitude,

        longitude: incoming.longitude,

        accuracy: incoming.accuracy ?? existing?.accuracy ?? 0,

        status: incoming.status || existing?.status || 'active',

        siteName: incoming.siteName || existing?.siteName,

        userId: incoming.userId || existing?.userId,

        timestamp: incoming.timestamp || Date.now(),

      };



      const others = guardsRef.current.filter((g) => g.guardId !== incoming.guardId);

      applyGuards([...others, updated]);

    },

    [applyGuards, locationUpdateThrottleMs],

  );



  const fetchLiveLocations = useCallback(async () => {

    try {

      const response = await apiService.getLiveLocations();

      if (response.success && Array.isArray(response.data)) {

        applyGuards(mapLiveLocationsApiResponse(response.data));

      }

    } catch (error) {

      if (__DEV__) {

        console.warn('Failed to fetch live guard locations:', error);

      }

    } finally {

      setLoading(false);

    }

  }, [applyGuards]);



  useEffect(() => {

    if (!enabled) {

      setLoading(false);

      return;

    }



    fetchLiveLocations();

    const pollTimer = setInterval(fetchLiveLocations, pollIntervalMs);

    return () => clearInterval(pollTimer);

  }, [enabled, fetchLiveLocations, pollIntervalMs]);



  useEffect(() => {

    if (!enabled) return;



    WebSocketService.connect();



    const connectionTimer = setInterval(() => {

      const connected = WebSocketService.isSocketConnected();

      setIsConnected((prev) => (prev === connected ? prev : connected));

    }, 5000);



    const unsubscribeBulk = WebSocketService.subscribeLiveLocations((payload) => {

      applyGuards(mapRealtimeWsPayload(payload));

    });



    const unsubscribeSingle = WebSocketService.subscribeGuardLocationUpdates((payload) => {

      upsertGuard({

        guardId: payload.guardId,

        latitude: payload.location?.latitude,

        longitude: payload.location?.longitude,

        accuracy: payload.location?.accuracy,

        timestamp: payload.timestamp || payload.location?.timestamp || Date.now(),

      });

    });



    return () => {

      clearInterval(connectionTimer);

      unsubscribeBulk();

      unsubscribeSingle();

    };

  }, [enabled, applyGuards, upsertGuard]);



  useEffect(() => {

    if (!enabled) return;



    if (guardsRef.current.length > 0) {

      applyGuards(guardsRef.current);

      return;

    }



    if (supplementalGuards.length > 0) {

      applyGuards(mapOperationsGuardStatuses(supplementalGuards as LiveGuardMarker[]));

    }

  }, [enabled, supplementalKey, applyGuards, supplementalGuards.length]);



  return {

    guards,

    loading,

    isConnected,

    refresh: fetchLiveLocations,

  };

};



export type { LiveGuardMarker };


