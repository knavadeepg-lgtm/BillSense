import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    supabaseUrl !== 'https://your-project.supabase.co' &&
    Boolean(supabaseKey) &&
    supabaseKey !== 'your_supabase_service_role_or_anon_key'
  );
};

// Real Supabase client instance
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// In-Memory Storage Fallback for local testing before Supabase keys are pasted
const inMemoryStore = {
  users: [],
  documents: [],
  line_items: [],
};

/**
 * Upload file buffer directly to Supabase Storage "documents" public bucket
 */
export const uploadFileToStorage = async (fileBuffer, mimeType, originalFilename) => {
  const fileExt = originalFilename.split('.').pop() || 'jpg';
  const uniqueName = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `uploads/${uniqueName}`;

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('Supabase Storage Upload Error:', error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  // Fallback data URL for local offline testing
  return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
};

/**
 * Delete file from Supabase Storage "documents" public bucket
 */
export const deleteFileFromStorage = async (fileUrl) => {
  if (!fileUrl || !isSupabaseConfigured() || !supabase) return false;

  try {
    // Extract relative storage path from full URL
    const urlParts = fileUrl.split('/storage/v1/object/public/documents/');
    if (urlParts.length > 1) {
      const storagePath = urlParts[1];
      const { error } = await supabase.storage
        .from('documents')
        .remove([storagePath]);

      if (error) {
        console.warn('Supabase storage delete warning:', error.message);
      }
      return true;
    }
  } catch (err) {
    console.warn('Error parsing file URL for deletion:', err);
  }
  return false;
};

/**
 * Data Access Layer (DAL) wrapping Supabase queries with fallback to in-memory store
 */
export const db = {
  // USER OPERATIONS
  async findUserByEmail(email) {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
    return inMemoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async createUser({ name, email, password_hash }) {
    const newUser = {
      id: isSupabaseConfigured() ? undefined : `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      password_hash,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('users')
        .insert([{ name, email, password_hash }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    inMemoryStore.users.push(newUser);
    return newUser;
  },

  async findUserById(id) {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, created_at')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }
    const u = inMemoryStore.users.find((u) => u.id === id);
    if (!u) return null;
    const { password_hash, ...userWithoutPassword } = u;
    return userWithoutPassword;
  },

  // DOCUMENT OPERATIONS
  async createDocument(docData, lineItems = []) {
    if (isSupabaseConfigured() && supabase) {
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .insert([docData])
        .select()
        .single();
      if (docError) throw docError;

      let insertedItems = [];
      if (lineItems.length > 0) {
        const itemsToInsert = lineItems.map((item) => ({
          ...item,
          document_id: doc.id,
        }));
        const { data: items, error: itemsError } = await supabase
          .from('line_items')
          .insert(itemsToInsert)
          .select();
        if (itemsError) throw itemsError;
        insertedItems = items;
      }
      return { ...doc, line_items: insertedItems };
    }

    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newDoc = {
      id: docId,
      ...docData,
      created_at: new Date().toISOString(),
    };
    inMemoryStore.documents.unshift(newDoc);

    const createdItems = lineItems.map((item) => ({
      id: `li_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      document_id: docId,
      ...item,
    }));
    inMemoryStore.line_items.push(...createdItems);

    return { ...newDoc, line_items: createdItems };
  },

  async getUserDocuments(userId) {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('documents')
        .select('*, line_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }

    return inMemoryStore.documents
      .filter((d) => d.user_id === userId)
      .map((d) => ({
        ...d,
        line_items: inMemoryStore.line_items.filter((li) => li.document_id === d.id),
      }));
  },

  async getDocumentById(id, userId) {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('documents')
        .select('*, line_items(*)')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }

    const doc = inMemoryStore.documents.find((d) => d.id === id && d.user_id === userId);
    if (!doc) return null;

    const items = inMemoryStore.line_items.filter((li) => li.document_id === doc.id);
    return { ...doc, line_items: items };
  },

  async updateDocument(id, userId, docData, lineItems) {
    if (isSupabaseConfigured() && supabase) {
      const { data: updatedDoc, error: docError } = await supabase
        .from('documents')
        .update(docData)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (docError) throw docError;

      if (lineItems) {
        await supabase.from('line_items').delete().eq('document_id', id);
        if (lineItems.length > 0) {
          const itemsToInsert = lineItems.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
            amount: Number(item.amount) || 0,
            document_id: id,
          }));
          await supabase.from('line_items').insert(itemsToInsert);
        }
      }

      return this.getDocumentById(id, userId);
    }

    const docIndex = inMemoryStore.documents.findIndex((d) => d.id === id && d.user_id === userId);
    if (docIndex === -1) return null;

    inMemoryStore.documents[docIndex] = {
      ...inMemoryStore.documents[docIndex],
      ...docData,
    };

    if (lineItems) {
      inMemoryStore.line_items = inMemoryStore.line_items.filter((li) => li.document_id !== id);
      const newItems = lineItems.map((item) => ({
        id: `li_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        document_id: id,
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unit_price: Number(item.unit_price) || 0,
        amount: Number(item.amount) || 0,
      }));
      inMemoryStore.line_items.push(...newItems);
    }

    return this.getDocumentById(id, userId);
  },

  async deleteDocument(id, userId) {
    const docToDelete = await this.getDocumentById(id, userId);
    if (docToDelete && docToDelete.file_url) {
      await deleteFileFromStorage(docToDelete.file_url);
    }

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      return true;
    }

    const initialLen = inMemoryStore.documents.length;
    inMemoryStore.documents = inMemoryStore.documents.filter((d) => !(d.id === id && d.user_id === userId));
    inMemoryStore.line_items = inMemoryStore.line_items.filter((li) => li.document_id !== id);
    return inMemoryStore.documents.length < initialLen;
  },
};
