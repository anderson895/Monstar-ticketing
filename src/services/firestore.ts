import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Trip, Booking, User, DashboardStats } from '@/types';
import { generateBookingRef } from '@/lib/utils';
import { logError, logInfo } from '@/lib/errorLogger';

// ─── Trips ────────────────────────────────────────────────────
export async function getTrips(): Promise<Trip[]> {
  try {
    const snap = await getDocs(query(collection(db, 'trips'), orderBy('departureDate', 'asc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip));
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'getTrips' });
    throw err;
  }
}

export async function getAvailableTrips(): Promise<Trip[]> {
  try {
    const snap = await getDocs(query(collection(db, 'trips'), where('status', 'in', ['scheduled', 'boarding']), orderBy('departureDate', 'asc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trip));
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'getAvailableTrips' });
    throw err;
  }
}

export async function getTripById(id: string): Promise<Trip | null> {
  try {
    const snap = await getDoc(doc(db, 'trips', id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Trip;
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'getTripById', metadata: { id } });
    throw err;
  }
}

export async function createTrip(data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const ref = await addDoc(collection(db, 'trips'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    await logInfo('Trip created', { component: 'firestore', action: 'createTrip', metadata: { tripId: ref.id } });
    return ref.id;
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'createTrip' });
    throw err;
  }
}

export async function updateTrip(id: string, data: Partial<Trip>): Promise<void> {
  try {
    await updateDoc(doc(db, 'trips', id), { ...data, updatedAt: serverTimestamp() });
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'updateTrip', metadata: { id } });
    throw err;
  }
}

export async function deleteTrip(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'trips', id));
    await logInfo('Trip deleted', { component: 'firestore', action: 'deleteTrip', metadata: { id } });
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'deleteTrip', metadata: { id } });
    throw err;
  }
}

// ─── Bookings ─────────────────────────────────────────────────
export async function createBooking(data: Omit<Booking, 'id' | 'bookingRef' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
  try {
    const bookingRef = generateBookingRef();
    const clean = Object.fromEntries(Object.entries({ ...data, bookingRef, status: 'pending', paymentStatus: 'unpaid', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }).filter(([, v]) => v !== undefined));
    const ref = await addDoc(collection(db, 'bookings'), clean);
    const trip = await getTripById(data.tripId);
    if (trip) await updateTrip(data.tripId, { availableSeats: Math.max(0, trip.availableSeats - data.passengers.length) });
    await logInfo('Booking created', { component: 'firestore', action: 'createBooking', userId: data.passengerId, metadata: { bookingId: ref.id, bookingRef } });
    return { id: ref.id, bookingRef, ...data, createdAt: new Date(), updatedAt: new Date(), status: 'pending', paymentStatus: 'unpaid' } as Booking;
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'createBooking', userId: data.passengerId });
    throw err;
  }
}

export async function getBookingsByPassenger(passengerId: string): Promise<Booking[]> {
  try {
    const snap = await getDocs(query(collection(db, 'bookings'), where('passengerId', '==', passengerId), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => { const data = d.data(); return { id: d.id, ...data, createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt), updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt) } as Booking; });
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'getBookingsByPassenger', userId: passengerId });
    throw err;
  }
}

export async function getAllBookings(): Promise<Booking[]> {
  try {
    const snap = await getDocs(query(collection(db, 'bookings'), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => { const data = d.data(); return { id: d.id, ...data, createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt), updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt) } as Booking; });
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'getAllBookings' });
    throw err;
  }
}

export async function getBookingById(id: string): Promise<Booking | null> {
  try {
    const snap = await getDoc(doc(db, 'bookings', id));
    if (!snap.exists()) return null;
    const data = snap.data();
    return { id: snap.id, ...data, createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(), updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date() } as Booking;
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'getBookingById', metadata: { id } });
    throw err;
  }
}

export async function updateBookingStatus(id: string, status: Booking['status']): Promise<void> {
  try {
    await updateDoc(doc(db, 'bookings', id), { status, updatedAt: serverTimestamp() });
    await logInfo('Booking status updated', { component: 'firestore', action: 'updateBookingStatus', metadata: { id, status } });
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'updateBookingStatus', metadata: { id, status } });
    throw err;
  }
}

export async function confirmPayment(id: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'bookings', id), { status: 'confirmed', paymentStatus: 'paid', updatedAt: serverTimestamp() });
    await logInfo('Payment confirmed', { component: 'firestore', action: 'confirmPayment', metadata: { id } });
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'confirmPayment', metadata: { id } });
    throw err;
  }
}

// ─── Users ────────────────────────────────────────────────────
export async function getAllUsers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => d.data() as User);
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'getAllUsers' });
    throw err;
  }
}

export async function getPassengers(): Promise<User[]> {
  try {
    const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'passenger')));
    return snap.docs.map((d) => d.data() as User);
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'getPassengers' });
    throw err;
  }
}

// ─── Dashboard Stats ──────────────────────────────────────────
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [bookings, trips] = await Promise.all([getAllBookings(), getTrips()]);
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    const revenue = bookings.filter((b) => b.paymentStatus === 'paid').reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const totalPassengers = bookings.reduce((sum, b) => sum + (b.passengers?.length || 0), 0);
    const activeTrips = trips.filter((t) => t.status === 'scheduled' || t.status === 'boarding').length;
    return { totalBookings: bookings.length, confirmedBookings: confirmed, pendingBookings: pending, cancelledBookings: cancelled, totalRevenue: revenue, totalPassengers, activeTrips };
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'getDashboardStats' });
    throw err;
  }
}

// ─── Manifest ─────────────────────────────────────────────────
export async function getManifestByTrip(tripId: string): Promise<Booking[]> {
  try {
    const snap = await getDocs(query(collection(db, 'bookings'), where('tripId', '==', tripId), where('status', '!=', 'cancelled')));
    return snap.docs.map((d) => { const data = d.data(); return { id: d.id, ...data, createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(), updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date() } as Booking; });
  } catch (err: any) {
    await logError({ message: err.message, error: err, component: 'firestore', action: 'getManifestByTrip', metadata: { tripId } });
    throw err;
  }
}
