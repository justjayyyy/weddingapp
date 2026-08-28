import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('wedding');
    const data = await db.collection('wedding-data').findOne({});

    if (!data) {
      // Return empty default state if no data exists
      return NextResponse.json({
        expenses: [],
        guests: [],
        tasks: [],
        vendors: [],
        tables: []
      });
    }

    // Remove the internal MongoDB _id field before sending to client
    const { _id, ...rest } = data;
    return NextResponse.json(rest);
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    
    // Basic validation
    if (!data || typeof data !== 'object' || !Array.isArray(data.guests)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('wedding');
    
    // We just keep one document for the whole app
    await db.collection('wedding-data').updateOne(
      {},
      { $set: data },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to update data:', error);
    return NextResponse.json({ error: 'Failed to update data' }, { status: 500 });
  }
}
