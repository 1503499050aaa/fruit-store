<template>
  <!-- 商品管理页 -->
  <div class="products-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>商品管理</span>
          <el-button type="primary" @click="openAddDialog">+ 添加水果</el-button>
        </div>
      </template>

      <!-- 筛选 -->
      <el-form :inline="true" :model="filter" size="default" style="margin-bottom: 16px;">
        <el-form-item label="分类">
          <el-select v-model="filter.category_id" placeholder="全部分类" clearable @change="loadProducts">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filter.status" placeholder="全部" clearable @change="loadProducts" style="width: 120px;">
            <el-option label="上架中" value="on" />
            <el-option label="已下架" value="off" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="filter.keyword" placeholder="搜索水果名称..." clearable @clear="loadProducts" @keyup.enter="loadProducts" style="width: 220px;">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-form-item>
      </el-form>

      <!-- 商品表格 -->
      <el-table :data="products" v-loading="loading" stripe>
        <el-table-column prop="name" label="水果名称" width="140" />
        <el-table-column prop="category_name" label="分类" width="100" />
        <el-table-column prop="image_url" label="图片" width="80">
          <template #default="scope">
            <el-image
              v-if="scope.row.image_url"
              :src="scope.row.image_url"
              style="width: 48px; height: 48px; border-radius: 6px;"
              fit="cover"
              :preview-src-list="[scope.row.image_url]"
            />
            <span v-else style="color:#ccc;font-size:24px;">🍎</span>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价(元/斤)" width="110" sortable>
          <template #default="scope">¥{{ scope.row.price }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="90" sortable>
          <template #default="scope">
            <el-tag :type="scope.row.stock < 10 ? 'danger' : scope.row.stock < 30 ? 'warning' : 'success'" size="small">
              {{ scope.row.stock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="origin" label="产地" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-switch
              :model-value="scope.row.status === 'on'"
              @change="(val) => toggleStatus(scope.row, val)"
              active-text="上架"
              inactive-text="下架"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="添加时间" width="160" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="openEditDialog(scope.row)">编辑</el-button>
            <el-popconfirm title="确定删除这个水果吗？" @confirm="handleDelete(scope.row.id)">
              <template #reference>
                <el-button type="danger" size="small" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div style="margin-top: 20px; text-align: right;">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @change="loadProducts"
        />
      </div>
    </el-card>

    <!-- ====== 添加/编辑商品对话框 ====== -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑水果' : '添加水果'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="水果名称" prop="name">
          <el-input v-model="form.name" placeholder="如：海南贵妃芒果" />
        </el-form-item>
        <el-form-item label="所属分类" prop="category_id">
          <el-select v-model="form.category_id" placeholder="请选择分类" style="width: 100%;">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="单价" prop="price">
          <el-input-number v-model="form.price" :min="0" :precision="1" :step="1" style="width: 200px;" />
          <span style="margin-left: 8px; color: #999;">元/斤</span>
        </el-form-item>
        <el-form-item label="库存数量" prop="stock">
          <el-input-number v-model="form.stock" :min="0" :step="1" style="width: 200px;" />
          <span style="margin-left: 8px; color: #999;">斤</span>
        </el-form-item>
        <el-form-item label="产地" prop="origin">
          <el-input v-model="form.origin" placeholder="如：海南三亚" />
        </el-form-item>
        <el-form-item label="图片URL" prop="image_url">
          <el-input v-model="form.image_url" placeholder="输入水果图片的网址" />
          <div style="margin-top: 4px; color: #999; font-size: 12px;">
            推荐使用 Unsplash 或自建图床，也可先留空用占位图标
          </div>
        </el-form-item>
        <el-form-item label="甜度" prop="sweetness">
          <el-input v-model="form.sweetness" placeholder="如：⭐⭐⭐⭐⭐" style="width: 200px;" />
        </el-form-item>
        <el-form-item label="口感标签" prop="taste_tags">
          <el-input v-model="form.taste_tags" placeholder="如：肉厚核薄,汁多味甜" />
        </el-form-item>
        <el-form-item label="商品描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="详细介绍这个水果的特点..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ isEdit ? '保存修改' : '确认添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/**
 * 商品管理页 - 上架/下架/增删改查水果
 */
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../api'

const products = ref([])
const categories = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const filter = reactive({ category_id: '', status: '', keyword: '' })

// 对话框相关
const dialogVisible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const formRef = ref(null)
const editId = ref(null)

const form = reactive({
  name: '', category_id: null, price: 9.9, stock: 10,
  origin: '海南', image_url: '', sweetness: '', taste_tags: '', description: '',
})

const rules = {
  name: [{ required: true, message: '请输入水果名称', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }],
}

/** 加载商品列表 */
async function loadProducts() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (filter.category_id) params.category_id = filter.category_id
    if (filter.status) params.status = filter.status
    if (filter.keyword) params.keyword = filter.keyword
    const res = await getProducts(params)
    if (res.code === 200) {
      products.value = res.data.list || res.data // 兼容不同返回格式
      total.value = res.data.total || (res.data.list || []).length
    }
  } finally {
    loading.value = false
  }
}

/** 加载分类 */
async function loadCategories() {
  const res = await getCategories()
  if (res.code === 200) categories.value = res.data
}

/** 打开添加对话框 */
function openAddDialog() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, { name: '', category_id: null, price: 9.9, stock: 10, origin: '海南', image_url: '', sweetness: '', taste_tags: '', description: '' })
  dialogVisible.value = true
}

/** 打开编辑对话框 */
function openEditDialog(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    name: row.name, category_id: row.category_id, price: row.price, stock: row.stock,
    origin: row.origin, image_url: row.image_url, sweetness: row.sweetness,
    taste_tags: row.taste_tags, description: row.description,
  })
  dialogVisible.value = true
}

/** 保存商品 */
async function handleSave() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    let res
    if (isEdit.value) {
      res = await updateProduct(editId.value, { ...form })
    } else {
      res = await createProduct({ ...form })
    }
    if (res.code === 200) {
      ElMessage.success(res.message)
      dialogVisible.value = false
      loadProducts()
    } else {
      ElMessage.error(res.message)
    }
  } finally {
    saving.value = false
  }
}

/** 切换上架/下架状态 */
async function toggleStatus(row, isOn) {
  await updateProduct(row.id, { ...row, status: isOn ? 'on' : 'off' })
  ElMessage.success(isOn ? '已上架' : '已下架')
  loadProducts()
}

/** 删除商品 */
async function handleDelete(id) {
  const res = await deleteProduct(id)
  if (res.code === 200) {
    ElMessage.success('已删除')
    loadProducts()
  } else {
    ElMessage.error(res.message)
  }
}

onMounted(() => {
  loadProducts()
  loadCategories()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
