import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Image, Link, Type, List, Phone, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const contentBlockSchema = z.object({
  type: z.enum(['heading', 'paragraph', 'image', 'link', 'steps', 'contact_info']),
  content: z.any(),
});

const pageContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  meta_description: z.string().optional(),
  is_published: z.boolean(),
  content: z.array(contentBlockSchema),
});

type ContentBlock = z.infer<typeof contentBlockSchema>;
type PageContent = z.infer<typeof pageContentSchema>;

interface PageContentEditorProps {
  pageSlug: string;
  onSave: () => void;
}

export function PageContentEditor({ pageSlug, onSave }: PageContentEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<any>(null);
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);

  const form = useForm<PageContent>({
    resolver: zodResolver(pageContentSchema),
    defaultValues: {
      title: '',
      meta_description: '',
      is_published: true,
      content: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      fetchPageContent();
    }
  }, [isOpen, pageSlug]);

  const fetchPageContent = async () => {
    const { data, error } = await supabase
      .from('page_content')
      .select('*')
      .eq('page_slug', pageSlug)
      .single();

    if (error && error.code !== 'PGRST116') {
      toast.error('Failed to fetch page content');
      return;
    }

    if (data) {
      setCurrentPage(data);
      form.reset({
        title: data.title,
        meta_description: data.meta_description || '',
        is_published: data.is_published,
        content: (data.content as ContentBlock[]) || [],
      });
    }
  };

  const onSubmit = async (values: PageContent) => {
    const { error } = await supabase
      .from('page_content')
      .upsert({
        page_slug: pageSlug,
        title: values.title,
        meta_description: values.meta_description,
        is_published: values.is_published,
        content: values.content,
        updated_by: (await supabase.auth.getUser()).data.user?.id,
      });

    if (error) {
      toast.error('Failed to save page content');
      return;
    }

    toast.success('Page content saved successfully');
    setIsOpen(false);
    onSave();
  };

  const addContentBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      type,
      content: getDefaultContent(type),
    };
    setEditingBlock(newBlock);
    setEditingIndex(-1);
    setIsBlockDialogOpen(true);
  };

  const editContentBlock = (block: ContentBlock, index: number) => {
    setEditingBlock(block);
    setEditingIndex(index);
    setIsBlockDialogOpen(true);
  };

  const saveContentBlock = (block: ContentBlock) => {
    const currentContent = form.getValues('content');
    if (editingIndex === -1) {
      form.setValue('content', [...currentContent, block]);
    } else {
      const updatedContent = [...currentContent];
      updatedContent[editingIndex] = block;
      form.setValue('content', updatedContent);
    }
    setIsBlockDialogOpen(false);
    setEditingBlock(null);
    setEditingIndex(-1);
  };

  const deleteContentBlock = (index: number) => {
    const currentContent = form.getValues('content');
    const updatedContent = currentContent.filter((_, i) => i !== index);
    form.setValue('content', updatedContent);
  };

  const getDefaultContent = (type: ContentBlock['type']) => {
    switch (type) {
      case 'heading':
        return 'Your Heading Here';
      case 'paragraph':
        return 'Your paragraph content here...';
      case 'image':
        return { url: '', alt: '', caption: '' };
      case 'link':
        return { url: '', text: '', description: '' };
      case 'steps':
        return [{ step: 1, title: 'Step Title', description: 'Step description' }];
      case 'contact_info':
        return { email: '', phone: '', address: '' };
      default:
        return '';
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('page-images')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Failed to upload image');
      return null;
    }

    const { data } = supabase.storage
      .from('page-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const renderContentPreview = (block: ContentBlock) => {
    switch (block.type) {
      case 'heading':
        return <h3 className="text-lg font-semibold">{block.content}</h3>;
      case 'paragraph':
        return <p className="text-sm text-muted-foreground">{block.content}</p>;
      case 'image':
        return (
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span className="text-sm">{block.content.alt || 'Image'}</span>
          </div>
        );
      case 'link':
        return (
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            <span className="text-sm">{block.content.text}</span>
          </div>
        );
      case 'steps':
        return (
          <div className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="text-sm">{block.content.length} steps</span>
          </div>
        );
      case 'contact_info':
        return (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="text-sm">Contact Information</span>
          </div>
        );
      default:
        return <span className="text-sm">Content Block</span>;
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline">
        <Edit className="h-4 w-4 mr-2" />
        Edit {pageSlug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Page
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {pageSlug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Page
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormLabel>Published</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="meta_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="SEO description for this page" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Page Content</h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addContentBlock('heading')}
                    >
                      <Type className="h-4 w-4 mr-1" />
                      Heading
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addContentBlock('paragraph')}
                    >
                      <Type className="h-4 w-4 mr-1" />
                      Text
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addContentBlock('image')}
                    >
                      <Image className="h-4 w-4 mr-1" />
                      Image
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addContentBlock('link')}
                    >
                      <Link className="h-4 w-4 mr-1" />
                      Link
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addContentBlock('steps')}
                    >
                      <List className="h-4 w-4 mr-1" />
                      Steps
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addContentBlock('contact_info')}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {form.watch('content').map((block, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {block.type}
                          </span>
                          {renderContentPreview(block)}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => editContentBlock(block, index)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteContentBlock(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Page</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ContentBlockDialog
        isOpen={isBlockDialogOpen}
        onClose={() => setIsBlockDialogOpen(false)}
        block={editingBlock}
        onSave={saveContentBlock}
        onUploadImage={uploadImage}
      />
    </>
  );
}

interface ContentBlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  block: ContentBlock | null;
  onSave: (block: ContentBlock) => void;
  onUploadImage: (file: File) => Promise<string | null>;
}

function ContentBlockDialog({ isOpen, onClose, block, onSave, onUploadImage }: ContentBlockDialogProps) {
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    if (block) {
      setContent(block.content);
    }
  }, [block]);

  if (!block) return null;

  const handleSave = () => {
    onSave({ ...block, content });
    onClose();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await onUploadImage(file);
      if (url) {
        setContent({ ...content, url });
      }
    }
  };

  const renderContentEditor = () => {
    switch (block.type) {
      case 'heading':
        return (
          <Input
            value={content || ''}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter heading text"
          />
        );

      case 'paragraph':
        return (
          <Textarea
            value={content || ''}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter paragraph content"
            rows={4}
          />
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-muted file:text-foreground hover:file:bg-muted/80"
              />
            </div>
            <Input
              value={content?.url || ''}
              onChange={(e) => setContent({ ...content, url: e.target.value })}
              placeholder="Or enter image URL"
            />
            <Input
              value={content?.alt || ''}
              onChange={(e) => setContent({ ...content, alt: e.target.value })}
              placeholder="Alt text"
            />
            <Input
              value={content?.caption || ''}
              onChange={(e) => setContent({ ...content, caption: e.target.value })}
              placeholder="Caption (optional)"
            />
          </div>
        );

      case 'link':
        return (
          <div className="space-y-4">
            <Input
              value={content?.url || ''}
              onChange={(e) => setContent({ ...content, url: e.target.value })}
              placeholder="URL"
            />
            <Input
              value={content?.text || ''}
              onChange={(e) => setContent({ ...content, text: e.target.value })}
              placeholder="Link text"
            />
            <Textarea
              value={content?.description || ''}
              onChange={(e) => setContent({ ...content, description: e.target.value })}
              placeholder="Description (optional)"
              rows={2}
            />
          </div>
        );

      case 'steps':
        return (
          <div className="space-y-4">
            {content?.map((step: any, index: number) => (
              <div key={index} className="border rounded p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Step {step.step}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newSteps = content.filter((_: any, i: number) => i !== index);
                      setContent(newSteps);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  value={step.title || ''}
                  onChange={(e) => {
                    const newSteps = [...content];
                    newSteps[index] = { ...step, title: e.target.value };
                    setContent(newSteps);
                  }}
                  placeholder="Step title"
                />
                <Textarea
                  value={step.description || ''}
                  onChange={(e) => {
                    const newSteps = [...content];
                    newSteps[index] = { ...step, description: e.target.value };
                    setContent(newSteps);
                  }}
                  placeholder="Step description"
                  rows={2}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const newStep = {
                  step: (content?.length || 0) + 1,
                  title: '',
                  description: ''
                };
                setContent([...(content || []), newStep]);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>
        );

      case 'contact_info':
        return (
          <div className="space-y-4">
            <Input
              value={content?.email || ''}
              onChange={(e) => setContent({ ...content, email: e.target.value })}
              placeholder="Email address"
              type="email"
            />
            <Input
              value={content?.phone || ''}
              onChange={(e) => setContent({ ...content, phone: e.target.value })}
              placeholder="Phone number"
            />
            <Textarea
              value={content?.address || ''}
              onChange={(e) => setContent({ ...content, address: e.target.value })}
              placeholder="Address"
              rows={3}
            />
          </div>
        );

      default:
        return <div>Unsupported content type</div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {block.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {renderContentEditor()}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}