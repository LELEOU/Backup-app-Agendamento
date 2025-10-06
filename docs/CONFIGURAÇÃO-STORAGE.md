# Configuração do Supabase Storage para Fotos

## Passo a Passo

### 1. Criar o Bucket de Storage

1. Acesse o dashboard do Supabase
2. Vá em **Storage** no menu lateral
3. Clique em **New bucket**
4. Configure o bucket:
   - **Name**: `photos`
   - **Public bucket**: ✅ Marque como público (para que as fotos possam ser visualizadas)
5. Clique em **Create bucket**

### 2. Configurar Políticas de Segurança (RLS)

Depois de criar o bucket, você precisa configurar as políticas de acesso:

1. Clique no bucket `photos` que você acabou de criar
2. Vá na aba **Policies**
3. Clique em **New Policy**

#### Política 1: Permitir Upload (INSERT)

**Ao criar a política na interface do Supabase:**
1. **Policy name**: `Allow authenticated users to upload`
2. **Allowed operation**: Marque ✅ `INSERT`
3. **Target roles**: Marque ✅ `authenticated`
4. **WITH CHECK expression**: Cole apenas isto:
```sql
bucket_id = 'photos'
```

#### Política 2: Permitir Leitura (SELECT)

**Ao criar a política na interface do Supabase:**
1. **Policy name**: `Allow public to view photos`
2. **Allowed operation**: Marque ✅ `SELECT`
3. **Target roles**: Marque ✅ `authenticated` + ✅ `anon`
4. **USING expression**: Cole apenas isto:
```sql
bucket_id = 'photos'
```

#### Política 3: Permitir Atualização (UPDATE)

**Ao criar a política na interface do Supabase:**
1. **Policy name**: `Allow authenticated users to update`
2. **Allowed operation**: Marque ✅ `UPDATE`
3. **Target roles**: Marque ✅ `authenticated`
4. **USING expression**: Cole apenas isto:
```sql
bucket_id = 'photos'
```

#### Política 4: Permitir Exclusão (DELETE)

**Ao criar a política na interface do Supabase:**
1. **Policy name**: `Allow authenticated users to delete`
2. **Allowed operation**: Marque ✅ `DELETE`
3. **Target roles**: Marque ✅ `authenticated`
4. **USING expression**: Cole apenas isto:
```sql
bucket_id = 'photos'
```

### 3. Estrutura de Pastas no Bucket

O sistema criará automaticamente as seguintes pastas:
- `photos/products/` - Fotos dos produtos
- `photos/staff/` - Fotos dos funcionários (futuro)

### 4. Testando

Após configurar tudo:
1. Faça login no sistema
2. Vá em **Vendas** (menu lateral)
3. Clique em **Novo Produto**
4. Preencha os dados e faça upload de uma foto
5. Salve o produto
6. A foto deve aparecer na lista de produtos

### 5. Troubleshooting

**Se a foto não aparecer:**
- Verifique se o bucket foi criado como público
- Verifique se as políticas foram criadas corretamente
- Abra o Console do navegador (F12) e veja se há erros
- Verifique se a URL da foto está sendo gerada corretamente

**Limite de tamanho:**
- O sistema aceita apenas imagens PNG e JPG
- Tamanho máximo: 2MB por arquivo
- Se precisar alterar o limite, modifique a validação no modal do produto

## Importante ⚠️

- As fotos ficam armazenadas permanentemente no Supabase Storage
- Ao deletar um produto, a foto **não** é deletada automaticamente (para evitar perdas acidentais)
- Para limpar fotos antigas, acesse o Storage manualmente e delete os arquivos não utilizados



-- Copie e execute este trecho no SQL Editor do Supabase:
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage products" ON products
    FOR ALL USING (auth.role() = 'authenticated');

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();