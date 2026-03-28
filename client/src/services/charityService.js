import api from '../utils/api';
import { isSupabaseConfigured, supabase } from '../utils/supabase';

const normalizeCharity = (charity) => ({
  ...charity,
  _id: charity._id || charity.id,
});

const buildSupabaseQuery = ({ search = '', category = '', featured = false } = {}) => {
  let query = supabase
    .from('charities')
    .select('*')
    .eq('active', true)
    .order('featured', { ascending: false })
    .order('name', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  if (featured) {
    query = query.eq('featured', true);
  }

  if (search) {
    const term = search.trim();
    if (term) {
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`);
    }
  }

  return query;
};

const fetchCharitiesFromApi = async ({ search = '', category = '' } = {}) => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  const response = await api.get(`/charities${params.toString() ? `?${params.toString()}` : ''}`);
  return {
    charities: (response.data.charities || []).map(normalizeCharity),
    categories: response.data.categories || [],
  };
};

const fetchFeaturedCharitiesFromApi = async () => {
  const response = await api.get('/charities?featured=true');
  return (response.data.charities || []).map(normalizeCharity);
};

const fetchCharityByIdFromApi = async (charityId) => {
  const response = await api.get(`/charities/${charityId}`);
  return normalizeCharity(response.data.charity);
};

export const fetchCharities = async ({ search = '', category = '' } = {}) => {
  if (!isSupabaseConfigured) {
    return fetchCharitiesFromApi({ search, category });
  }

  try {
    const { data, error } = await buildSupabaseQuery({ search, category });
    if (error || !Array.isArray(data) || data.length === 0) {
      return fetchCharitiesFromApi({ search, category });
    }

    const charities = (data || []).map(normalizeCharity);
    const categories = [...new Set(charities.map((charity) => charity.category).filter(Boolean))];
    return { charities, categories };
  } catch (error) {
    return fetchCharitiesFromApi({ search, category });
  }
};

export const fetchFeaturedCharities = async () => {
  if (!isSupabaseConfigured) {
    return fetchFeaturedCharitiesFromApi();
  }

  try {
    const { data, error } = await buildSupabaseQuery({ featured: true });
    if (error || !Array.isArray(data) || data.length === 0) {
      return fetchFeaturedCharitiesFromApi();
    }
    return (data || []).map(normalizeCharity);
  } catch (error) {
    return fetchFeaturedCharitiesFromApi();
  }
};

export const fetchCharityById = async (charityId) => {
  if (!isSupabaseConfigured) {
    return fetchCharityByIdFromApi(charityId);
  }

  try {
    const { data, error } = await supabase
      .from('charities')
      .select('*')
      .eq('id', charityId)
      .eq('active', true)
      .single();

    if (error || !data) {
      return fetchCharityByIdFromApi(charityId);
    }
    return normalizeCharity(data);
  } catch (error) {
    return fetchCharityByIdFromApi(charityId);
  }
};
