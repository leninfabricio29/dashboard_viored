import api from "./api";

const BASE_PATH = "/api/documents";

export interface DocumentCategory { _id: string; name: string; code: string; description?: string; status: boolean; createdAt?: string; }
export interface DocumentVariable { _id: string; category: string; name: string; variable: string; path: string; type: VariableType; description?: string; status: boolean; }
export type VariableType = "text" | "number" | "date" | "time" | "datetime" | "boolean" | "currency" | "collection";
export interface TemplateCategory { _id: string; name: string; code: string; }
export interface DocumentTemplate { _id: string; category: TemplateCategory | string; module: string; name: string; description?: string; content: string; version: number; showHeader: boolean; showFooter: boolean; status: boolean; updatedAt?: string; }
export interface GeneratedDocument { _id: string; template: Pick<DocumentTemplate, "_id" | "name" | "version"> | string; reference: { module: string; id: string }; html: string; createdAt: string; }
export interface DocumentPreview { templateId: string; html: string; values: Record<string, unknown>; }
export type CategoryInput = Pick<DocumentCategory, "name" | "code" | "description" | "status">;
export type VariableInput = Omit<DocumentVariable, "_id" | "category">;
export type TemplateInput = Omit<DocumentTemplate, "_id" | "version" | "updatedAt" | "category"> & { category: string };

const documentService = {
  async getCategories() { return (await api.get<{ categories: DocumentCategory[] }>(`${BASE_PATH}/categories`)).data.categories; },
  async createCategory(data: CategoryInput) { return (await api.post<{ category: DocumentCategory }>(`${BASE_PATH}/categories`, data)).data.category; },
  async updateCategory(id: string, data: Partial<CategoryInput>) { return (await api.patch<{ category: DocumentCategory }>(`${BASE_PATH}/categories/${id}`, data)).data.category; },
  async deleteCategory(id: string) { await api.delete(`${BASE_PATH}/categories/${id}`); },
  async getVariables(categoryId: string) { return (await api.get<{ variables: DocumentVariable[] }>(`${BASE_PATH}/categories/${categoryId}/variables`)).data.variables; },
  async createVariable(categoryId: string, data: VariableInput) { return (await api.post<{ variable: DocumentVariable }>(`${BASE_PATH}/categories/${categoryId}/variables`, data)).data.variable; },
  async updateVariable(categoryId: string, variableId: string, data: Partial<VariableInput>) { return (await api.patch<{ variable: DocumentVariable }>(`${BASE_PATH}/categories/${categoryId}/variables/${variableId}`, data)).data.variable; },
  async deleteVariable(categoryId: string, variableId: string) { await api.delete(`${BASE_PATH}/categories/${categoryId}/variables/${variableId}`); },
  async getTemplates(category?: string) { return (await api.get<{ templates: DocumentTemplate[] }>(`${BASE_PATH}/templates`, { params: category ? { category } : undefined })).data.templates; },
  async getTemplate(id: string) { return (await api.get<{ template: DocumentTemplate }>(`${BASE_PATH}/templates/${id}`)).data.template; },
  async createTemplate(data: TemplateInput) { return (await api.post<{ template: DocumentTemplate }>(`${BASE_PATH}/templates`, data)).data.template; },
  async updateTemplate(id: string, data: Partial<TemplateInput>) { return (await api.patch<{ template: DocumentTemplate }>(`${BASE_PATH}/templates/${id}`, data)).data.template; },
  async deleteTemplate(id: string) { await api.delete(`${BASE_PATH}/templates/${id}`); },
  async previewTemplate(id: string, reference: { module: string; id: string }, values: Record<string, unknown> = {}) { return (await api.post<DocumentPreview>(`${BASE_PATH}/templates/${id}/preview`, { reference, values })).data; },
  async generateDocument(id: string, reference: { module: string; id: string }, values: Record<string, unknown> = {}) { return (await api.post<{ document: GeneratedDocument }>(`${BASE_PATH}/templates/${id}/generate`, { reference, values })).data.document; },
  async getGeneratedDocuments() { return (await api.get<{ documents: GeneratedDocument[] }>(`${BASE_PATH}/generated`)).data.documents; },
};

export default documentService;
