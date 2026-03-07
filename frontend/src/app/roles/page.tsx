'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { JobRole } from '@/lib/types';
import Input from '@/components/ui/Input';
import RoleCard from '@/components/RoleCard';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import SkillTag from '@/components/ui/SkillTag';

export default function RolesPage() {
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);

  const categories = [...new Set(roles.map(r => r.category).filter(Boolean))] as string[];

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await api.getRoles();
        setRoles(data);
        setFilteredRoles(data);
      } catch (err) {
        console.error('Failed to load roles:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, []);

  useEffect(() => {
    let filtered = roles;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.title.toLowerCase().includes(searchLower) ||
          r.required_skills.some(s => s.toLowerCase().includes(searchLower))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(r => r.category === selectedCategory);
    }

    setFilteredRoles(filtered);
  }, [search, selectedCategory, roles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Browse Job Roles</h1>
        <p className="text-gray-600 mt-1">
          Explore tech roles and their required skills
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search roles or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            isSelected={selectedRole?.id === role.id}
            onSelect={setSelectedRole}
          />
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No roles found matching your search.</p>
        </div>
      )}

      {/* Selected Role Details */}
      {selectedRole && (
        <Card variant="elevated" className="sticky bottom-4">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{selectedRole.title}</CardTitle>
                <p className="text-sm text-gray-500">{selectedRole.category}</p>
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedRole.description && (
              <p className="text-gray-600">{selectedRole.description}</p>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Required Skills:</p>
              <div className="flex flex-wrap gap-2">
                {selectedRole.required_skills.map((skill) => (
                  <SkillTag key={skill} skill={skill} variant="error" />
                ))}
              </div>
            </div>

            {selectedRole.nice_to_have_skills.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Nice to Have:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedRole.nice_to_have_skills.map((skill) => (
                    <SkillTag key={skill} skill={skill} variant="info" />
                  ))}
                </div>
              </div>
            )}

            {selectedRole.avg_salary_range && (
              <p className="text-sm">
                <span className="text-gray-500">Salary Range:</span>{' '}
                <span className="font-medium text-green-600">{selectedRole.avg_salary_range}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
