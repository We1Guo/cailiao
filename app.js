// 数据存储
let productionPlans = [];
let materials = [];
let productionExecutions = [];
let leftoverMaterials = [];

// DOM 元素
let planList = null;
let materialList = null;
let executionList = null;
let addPlanBtn = null;
let addPlanModal = null;
let planForm = null;
let savePlanBtn = null;
let addMaterialModal = null;
let materialForm = null;
let addMaterialBtn = null;
let saveMaterialBtn = null;
let productionModal = null;
let clearDataBtn = null;

// 页面加载时初始化DOM元素
document.addEventListener('DOMContentLoaded', () => {
    console.log('初始化DOM元素...');
    
    // 获取列表元素 - 新的HTML结构
    planList = document.getElementById('productionTable').querySelector('tbody');
    materialList = document.getElementById('materialsTable').querySelector('tbody');
    
    // 获取按钮元素 - 新的HTML结构
    savePlanBtn = document.getElementById('savePlanBtn');
    saveMaterialBtn = document.getElementById('saveMaterialBtn');
    clearDataBtn = document.getElementById('clearData');
    
    // 获取表单元素 - 新的HTML结构
    planForm = document.getElementById('planForm');
    materialForm = document.getElementById('materialForm');
    
    // 初始化模态框 - 新的HTML结构
    try {
        // 使用Bootstrap 5的方式初始化模态框
        addPlanModal = new bootstrap.Modal(document.getElementById('addPlanModal'));
        addMaterialModal = new bootstrap.Modal(document.getElementById('addMaterialModal'));
        productionModal = new bootstrap.Modal(document.getElementById('productionModal'));
        
        console.log('模态框初始化成功');
    } catch (error) {
        console.error('模态框初始化失败:', error);
    }
    
    // 从localStorage加载数据
    try {
        productionPlans = JSON.parse(localStorage.getItem('productionPlans')) || [];
        materials = JSON.parse(localStorage.getItem('materials')) || [];
        productionExecutions = JSON.parse(localStorage.getItem('productionExecutions')) || [];
        leftoverMaterials = JSON.parse(localStorage.getItem('leftoverMaterials')) || [];
        
        console.log('数据加载完成:');
        console.log('生产计划数量:', productionPlans.length);
        console.log('物料数量:', materials.length);
        console.log('执行记录数量:', productionExecutions.length);
    } catch (error) {
        console.error('加载数据时出错:', error);
        // 如果数据损坏，重置数据
        resetAllData();
    }
    
    // 设置事件监听器
    setupEventListeners();
    
    // 默认设置日期为今天
    setDefaultDates();
    
    // 渲染生产计划页面（默认页面）
    loadProductionPlans();
    
    console.log('初始化完成');
});

// 重置所有数据
function resetAllData() {
    productionPlans = [];
    materials = [];
    productionExecutions = [];
    leftoverMaterials = [];
    
    localStorage.setItem('productionPlans', JSON.stringify(productionPlans));
    localStorage.setItem('materials', JSON.stringify(materials));
    localStorage.setItem('productionExecutions', JSON.stringify(productionExecutions));
    localStorage.setItem('leftoverMaterials', JSON.stringify(leftoverMaterials));
}

// 设置默认日期为今天
function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const planDateInput = document.getElementById('planDate');
    const materialDateInput = document.getElementById('materialDate');
    
    if (planDateInput) planDateInput.value = today;
    if (materialDateInput) materialDateInput.value = today;
}

// 设置事件监听器
function setupEventListeners() {
    // 页面切换
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = e.target.closest('.nav-link').dataset.page;
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.add('d-none');
            });
            const targetPage = document.getElementById(pageId + '-page');
            if (targetPage) {
                targetPage.classList.remove('d-none');
            } else {
                console.error('找不到页面元素:', pageId + '-page');
                return;
            }
            
            // 更新导航栏激活状态
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            e.target.closest('.nav-link').classList.add('active');
            
            // 加载页面数据
            loadPageData(pageId);
        });
    });

    // 添加清除数据按钮事件
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            if (confirm('确定要清除所有数据吗？此操作不可撤销!')) {
                resetAllData();
                loadDashboardData();
                alert('数据已清除');
            }
        });
    }
    
    // 保存生产计划
    if (savePlanBtn) {
        savePlanBtn.addEventListener('click', savePlan);
    }
    
    // 保存物料
    if (saveMaterialBtn) {
        saveMaterialBtn.addEventListener('click', saveMaterial);
    }
    
    // 绑定生产执行相关事件
    const startProductionBtn = document.getElementById('startProductionBtn');
    if (startProductionBtn) {
        startProductionBtn.addEventListener('click', executeProduction);
    }
    
    // 模态框打开时设置默认日期
    document.getElementById('addPlanModal').addEventListener('show.bs.modal', function () {
        setDefaultDates();
    });
    
    document.getElementById('addMaterialModal').addEventListener('show.bs.modal', function () {
        setDefaultDates();
    });
    
    // 添加剩余材料选项的事件监听
    document.getElementById('hasRemainingMaterial')?.addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('remainingMaterialInfo').classList.remove('d-none');
        }
    });
    
    document.getElementById('noRemainingMaterial')?.addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('remainingMaterialInfo').classList.add('d-none');
        }
    });

    // 生产计划状态筛选
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', function() {
            // 更新按钮激活状态
            document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            filterProductionPlans(filter);
        });
    });
    
    // 材料状态筛选
    document.querySelectorAll('[data-filter-material]').forEach(btn => {
        btn.addEventListener('click', function() {
            // 更新按钮激活状态
            document.querySelectorAll('[data-filter-material]').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter-material');
            filterMaterials(filter);
        });
    });
}

// 加载页面数据
function loadPageData(pageId) {
    switch(pageId) {
        case 'home':
            loadDashboardData();
            break;
        case 'production':
            loadProductionPlans();
            break;
        case 'materials':
            loadMaterials();
            break;
        case 'statistics':
            loadStatistics();
            break;
    }
}

// 加载首页仪表盘数据
function loadDashboardData() {
    // 更新统计数字
    document.getElementById('pendingPlansCount').textContent = productionPlans.filter(p => p.status === 'pending').length;
    document.getElementById('completedPlansCount').textContent = productionPlans.filter(p => p.status === 'completed').length;
    document.getElementById('materialsCount').textContent = materials.length;
    document.getElementById('leftoverCount').textContent = leftoverMaterials.length;
    
    // 最近生产计划
    const recentPlans = productionPlans.slice(0, 5);
    const recentPlansTable = document.getElementById('recentPlansTable').querySelector('tbody');
    recentPlansTable.innerHTML = '';
    
    if (recentPlans.length > 0) {
        recentPlans.forEach(plan => {
            const typeIcon = plan.type === 'annealed' ? 
                '<span class="type-icon type-annealed">火</span>' : 
                '<span class="type-icon type-cold-drawn">冷</span>';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${typeIcon} ${formatSpecAndLength(plan.specification, plan.length)}</td>
                <td>${plan.quantity}</td>
                <td><span class="status-badge status-${plan.status}">${getStatusText(plan.status)}</span></td>
            `;
            recentPlansTable.appendChild(row);
        });
        document.getElementById('noRecentPlans').classList.add('d-none');
    } else {
        document.getElementById('noRecentPlans').classList.remove('d-none');
    }
    
    // 最近物料入库
    const recentMaterials = materials.slice(0, 5);
    const recentMaterialsTable = document.getElementById('recentMaterialsTable').querySelector('tbody');
    recentMaterialsTable.innerHTML = '';
    
    if (recentMaterials.length > 0) {
        recentMaterials.forEach(material => {
            const typeIcon = material.type === 'annealed' ? 
                '<span class="type-icon type-annealed">火</span>' : 
                '<span class="type-icon type-cold-drawn">冷</span>';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${typeIcon} ${material.specification}</td>
                <td>${material.type === 'annealed' ? '退火管' : '冷拔管'}</td>
                <td>${material.weight}kg</td>
                <td>${material.inboundDate || formatDate(material.createdAt)}</td>
            `;
            recentMaterialsTable.appendChild(row);
        });
        document.getElementById('noRecentMaterials').classList.add('d-none');
    } else {
        document.getElementById('noRecentMaterials').classList.remove('d-none');
    }
}

// 加载生产计划页面
function loadProductionPlans() {
    const productionTable = document.getElementById('productionTable').querySelector('tbody');
    productionTable.innerHTML = '';
    
    if (productionPlans.length > 0) {
        productionPlans.forEach((plan, index) => {
            const completedQuantity = getCompletedQuantity(plan.id);
            const typeIcon = plan.type === 'annealed' ? 
                '<span class="type-icon type-annealed">火</span>' : 
                '<span class="type-icon type-cold-drawn">冷</span>';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${typeIcon} ${formatSpecAndLength(plan.specification, plan.length)}</td>
                <td class="d-none">${plan.type === 'annealed' ? '退火管' : '冷拔管'}</td>
                <td>${plan.quantity}</td>
                <td>${completedQuantity}</td>
                <td class="d-none d-md-table-cell">${formatDate(plan.planDate || plan.createdAt)}</td>
                <td><span class="status-badge status-${plan.status}">${getStatusText(plan.status)}</span></td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        ${plan.status !== 'completed' ? 
                            `<button class="btn btn-primary produce-btn" data-plan-id="${plan.id}" title="生产">
                                <i class="bi bi-play-fill"></i>
                            </button>` : 
                            `<button class="btn btn-outline-secondary" disabled style="visibility:hidden">
                                <i class="bi bi-play-fill"></i>
                            </button>`}
                        <button class="btn btn-warning edit-plan-btn" data-plan-id="${plan.id}" title="编辑">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn btn-danger delete-plan-btn" data-plan-id="${plan.id}" title="删除">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </td>
            `;
            productionTable.appendChild(row);
        });
        
        // 添加事件处理程序
        document.querySelectorAll('.produce-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const planId = parseInt(this.getAttribute('data-plan-id'));
                showProductionModal(planId);
            });
        });
        
        document.querySelectorAll('.edit-plan-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const planId = parseInt(this.getAttribute('data-plan-id'));
                editPlan(planId);
            });
        });
        
        document.querySelectorAll('.delete-plan-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const planId = parseInt(this.getAttribute('data-plan-id'));
                deletePlan(planId);
            });
        });
        
        document.getElementById('noProduction').classList.add('d-none');
    } else {
        document.getElementById('noProduction').classList.remove('d-none');
    }
    
    // 加载待生产计划表 - 检查元素是否存在
    const pendingPlansTable = document.querySelector('#production-page #pendingPlansTable tbody');
    if (pendingPlansTable) { // 添加检查
        const pendingPlans = productionPlans.filter(p => p.status === 'pending');
        pendingPlansTable.innerHTML = '';
        
        if (pendingPlans.length > 0) {
            pendingPlans.forEach(plan => {
                const typeIcon = plan.type === 'annealed' ? 
                    '<span class="type-icon type-annealed">火</span>' : 
                    '<span class="type-icon type-cold-drawn">冷</span>';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${typeIcon} ${formatSpecAndLength(plan.specification, plan.length)}</td>
                    <td class="d-none">${plan.type === 'annealed' ? '退火管' : '冷拔管'}</td>
                    <td>${plan.quantity}</td>
                    <td class="d-none d-md-table-cell">${formatDate(plan.planDate || plan.createdAt)}</td>
                `;
                pendingPlansTable.appendChild(row);
            });
            document.querySelector('#production-page #noPendingPlans')?.classList.add('d-none');
        } else {
            document.querySelector('#production-page #noPendingPlans')?.classList.remove('d-none');
        }
    }
}

// 获取已完成数量
function getCompletedQuantity(planId) {
    const execution = productionExecutions.find(e => e.planId === planId);
    return execution ? execution.completedQuantity : 0;
}

// 加载物料页面
function loadMaterials() {
    const materialsTable = document.getElementById('materialsTable').querySelector('tbody');
    materialsTable.innerHTML = '';
    
    if (materials.length > 0) {
        materials.forEach(material => {
            // 材料类型图标 - 带文字的方形图标
            const typeIcon = material.type === 'annealed' ? 
                '<span class="type-icon type-annealed">火</span>' : 
                '<span class="type-icon type-cold-drawn">冷</span>';
            
            // 材料状态显示
            let statusBadge = '';
            if (material.status === '已用完') {
                statusBadge = '<span class="status-badge status-completed">已用完</span>';
            } else if (material.status === '可用') {
                statusBadge = '<span class="status-badge status-pending">可使用</span>';
            } else {
                statusBadge = '<span class="status-badge">未知</span>';
            }
            
            // 根数显示
            const quantityDisplay = material.quantity ? material.quantity + '根' : '-';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${typeIcon} ${material.specification}</td>
                <td class="d-none">${material.type === 'annealed' ? '退火管' : '冷拔管'}</td>
                <td>${quantityDisplay}</td>
                <td>${material.weight}kg</td>
                <td class="d-none d-md-table-cell">${formatDate(material.materialDate || material.createdAt)}</td>
                <td>${statusBadge}</td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-warning edit-material-btn" data-material-id="${material.id}" title="编辑">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn btn-danger delete-material-btn" data-material-id="${material.id}" title="删除">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                </td>
            `;
            materialsTable.appendChild(row);
        });
        
        // 添加事件处理程序
        document.querySelectorAll('.edit-material-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const materialId = parseInt(this.getAttribute('data-material-id'));
                editMaterial(materialId);
            });
        });
        
        document.querySelectorAll('.delete-material-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const materialId = parseInt(this.getAttribute('data-material-id'));
                deleteMaterial(materialId);
            });
        });
        
        document.getElementById('noMaterials').classList.add('d-none');
    } else {
        document.getElementById('noMaterials').classList.remove('d-none');
    }
}

// 加载统计页面
function loadStatistics() {
    // 更新统计数字
    const pendingPlans = productionPlans.filter(p => p.status === 'pending');
    const inProgressPlans = productionPlans.filter(p => p.status === 'in-progress');
    const completedPlans = productionPlans.filter(p => p.status === 'completed');
    const availableMaterials = materials.filter(m => m.status === '可用');
    const usedMaterials = materials.filter(m => m.status === '已用完');
    
    document.getElementById('statsPendingPlansCount').textContent = pendingPlans.length;
    document.getElementById('statsInProgressPlansCount').textContent = inProgressPlans.length;
    document.getElementById('statsCompletedPlansCount').textContent = completedPlans.length;
    document.getElementById('statsAvailableMaterialsCount').textContent = availableMaterials.length;
    
    // 计算总计划数量
    const totalPlanQuantity = productionPlans.reduce((sum, plan) => sum + parseInt(plan.quantity || 0), 0);
    // 计算已完成数量
    const completedQuantity = productionExecutions.reduce((sum, execution) => sum + parseInt(execution.completedQuantity || 0), 0);
    // 计算剩余待生产数量
    const pendingQuantity = pendingPlans.reduce((sum, plan) => sum + parseInt(plan.quantity || 0), 0);
    // 计算进行中数量
    const inProgressQuantity = inProgressPlans.reduce((sum, plan) => sum + parseInt(plan.quantity || 0), 0);
    
    // 计算可用材料总重量
    const availableMaterialsWeight = availableMaterials.reduce((sum, material) => sum + parseFloat(material.weight || 0), 0);
    // 计算已用材料总重量
    const usedMaterialsWeight = usedMaterials.reduce((sum, material) => sum + parseFloat(material.weight || 0), 0);
    
    // 计算冷拔管和退火管生产总数
    const annealedPlans = productionExecutions.filter(exe => {
        const plan = productionPlans.find(p => p.id === exe.planId);
        return plan && plan.type === 'annealed';
    });
    const coldDrawnPlans = productionExecutions.filter(exe => {
        const plan = productionPlans.find(p => p.id === exe.planId);
        return plan && plan.type === 'cold-drawn';
    });
    
    const annealedTotal = annealedPlans.reduce((sum, exe) => sum + parseInt(exe.completedQuantity || 0), 0);
    const coldDrawnTotal = coldDrawnPlans.reduce((sum, exe) => sum + parseInt(exe.completedQuantity || 0), 0);
    
    document.getElementById('statsAnnealedTotal').textContent = annealedTotal;
    document.getElementById('statsColdDrawnTotal').textContent = coldDrawnTotal;
    
    // 更新详细统计数据
    document.getElementById('totalPlanQuantity').textContent = totalPlanQuantity;
    document.getElementById('completedQuantity').textContent = completedQuantity;
    document.getElementById('pendingQuantity').textContent = pendingQuantity;
    document.getElementById('inProgressQuantity').textContent = inProgressQuantity;
    document.getElementById('availableMaterialsWeight').textContent = availableMaterialsWeight.toFixed(2) + " kg";
    document.getElementById('usedMaterialsWeight').textContent = usedMaterialsWeight.toFixed(2) + " kg";
    
    // 待生产计划统计
    const pendingPlansTable = document.getElementById('pendingPlansTable').querySelector('tbody');
    pendingPlansTable.innerHTML = '';
    
    if (pendingPlans.length > 0) {
        pendingPlans.forEach(plan => {
            const typeIcon = plan.type === 'annealed' ? 
                '<span class="type-icon type-annealed">火</span>' : 
                '<span class="type-icon type-cold-drawn">冷</span>';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${typeIcon} ${formatSpecAndLength(plan.specification, plan.length)}</td>
                <td class="d-none">${plan.type === 'annealed' ? '退火管' : '冷拔管'}</td>
                <td>${plan.quantity}</td>
                <td class="d-none d-md-table-cell">${formatDate(plan.planDate || plan.createdAt)}</td>
            `;
            pendingPlansTable.appendChild(row);
        });
        document.getElementById('noPendingPlans').classList.add('d-none');
    } else {
        document.getElementById('noPendingPlans').classList.remove('d-none');
    }
    
    // 物料库存统计
    const materialStatsTable = document.getElementById('materialStatsTable').querySelector('tbody');
    materialStatsTable.innerHTML = '';
    
    if (materials.length > 0) {
        // 按规格分组物料
        const materialsBySpec = {};
        materials.forEach(material => {
            const key = `${material.specification}-${material.type}`;
            if (!materialsBySpec[key]) {
                materialsBySpec[key] = {
                    specification: material.specification,
                    type: material.type,
                    totalWeight: 0,
                    totalQuantity: 0,
                    latestDate: null
                };
            }
            materialsBySpec[key].totalWeight += parseFloat(material.weight || 0);
            if (material.quantity !== null) {
                materialsBySpec[key].totalQuantity += parseInt(material.quantity);
            }
            
            const materialDate = material.materialDate || material.createdAt;
            if (!materialsBySpec[key].latestDate || new Date(materialDate) > new Date(materialsBySpec[key].latestDate)) {
                materialsBySpec[key].latestDate = materialDate;
            }
        });
        
        // 显示统计结果
        Object.values(materialsBySpec).forEach(stats => {
            const typeText = stats.type === 'annealed' ? '退火管' : '冷拔管';
            const typeIcon = stats.type === 'annealed' ? 
                '<span class="type-icon type-annealed">火</span>' : 
                '<span class="type-icon type-cold-drawn">冷</span>';
            const quantityDisplay = stats.totalQuantity > 0 ? `${stats.totalQuantity}根` : '-';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${typeIcon} ${stats.specification}</td>
                <td class="d-none">${typeText}</td>
                <td>${stats.totalWeight.toFixed(2)}</td>
                <td>${quantityDisplay}</td>
                <td class="d-none d-md-table-cell">${formatDate(stats.latestDate)}</td>
            `;
            materialStatsTable.appendChild(row);
        });
        
        document.getElementById('noMaterialStats').classList.add('d-none');
    } else {
        document.getElementById('noMaterialStats').classList.remove('d-none');
    }
}

// 保存生产计划
function savePlan() {
    // 检查是否是编辑模式，如果是，则不执行添加操作
    if (document.getElementById('planModalTitle').textContent.includes('编辑')) {
        return; // 编辑模式下已经由专门的编辑处理函数处理
    }
    
    const specification = document.getElementById('specification').value;
    const type = document.getElementById('planType').value;
    const length = document.getElementById('length').value;
    const quantity = document.getElementById('quantity').value;
    const planDate = document.getElementById('planDate').value;
    
    if (!specification || !type || !length || !quantity || !planDate) {
        alert('请填写完整信息');
        return;
    }
    
    const newPlan = {
        id: Date.now(),
        specification: specification,
        type: type,
        length: parseFloat(length),
        quantity: parseInt(quantity),
        planDate: planDate,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    productionPlans.unshift(newPlan);
    localStorage.setItem('productionPlans', JSON.stringify(productionPlans));
    
    addPlanModal.hide();
    document.getElementById('planForm').reset();
    
    loadProductionPlans();
    loadDashboardData();
    
    alert('生产计划已添加');
}

// 保存物料
function saveMaterial() {
    // 检查是否是编辑模式，如果是，则不执行添加操作
    if (document.getElementById('materialModalTitle').textContent.includes('编辑')) {
        return; // 编辑模式下已经由专门的编辑处理函数处理
    }
    
    const specification = document.getElementById('materialSpec').value;
    const type = document.getElementById('materialType').value;
    const quantity = document.getElementById('materialQuantity').value;
    const weight = document.getElementById('materialWeight').value;
    const materialDate = document.getElementById('materialDate').value;
    
    if (!specification || !type || !weight || !materialDate) {
        alert('请填写完整信息（根数可选填）');
        return;
    }
    
    const now = new Date();
    const newMaterial = {
        id: Date.now(),
        specification: specification,
        type: type,
        quantity: quantity ? parseInt(quantity) : null, // 根数可能不确定，为null表示未知
        weight: parseFloat(weight),
        materialDate: materialDate,
        createdAt: now.toISOString(),
        status: '可使用'  // 修改为"可使用"
    };
    
    materials.unshift(newMaterial);
    localStorage.setItem('materials', JSON.stringify(materials));
    
    addMaterialModal.hide();
    document.getElementById('materialForm').reset();
    
    loadMaterials();
    loadDashboardData();
    
    alert('物料已入库');
}

// 显示生产模态框
function showProductionModal(planId) {
    const plan = productionPlans.find(p => p.id === planId);
    if (!plan) {
        alert('生产计划不存在');
        return;
    }
    
    // 检查是否有匹配的物料库存（同规格同类型）
    const matchingMaterials = materials.filter(m => 
        m.specification === plan.specification && 
        m.type === plan.type &&
        m.status === '可使用'
    );
    
    if (matchingMaterials.length === 0) {
        alert(`没有找到规格为 ${plan.specification} 的${plan.type === 'annealed' ? '退火管' : '冷拔管'}可用物料，请先入库物料。`);
        return;
    }
    
    // 显示计划信息
    const typeText = plan.type === 'annealed' ? '退火管' : '冷拔管';
    document.getElementById('planInfo').textContent = 
        `规格: ${formatSpecAndLength(plan.specification, plan.length)}, 类型: ${typeText}, 计划数量: ${plan.quantity}`;
    
    // 填充可用材料下拉列表
    const materialSelect = document.getElementById('materialSelect');
    materialSelect.innerHTML = '';
    
    matchingMaterials.forEach(material => {
        const option = document.createElement('option');
        option.value = material.id;
        const quantityInfo = material.quantity ? `根数: ${material.quantity}根, ` : '';
        option.textContent = `规格: ${material.specification}, 类型: ${typeText}, ${quantityInfo}重量: ${material.weight}kg`;
        materialSelect.appendChild(option);
    });
    
    // 重置生产数量，默认为计划数量
    document.getElementById('productionQuantity').value = plan.quantity;
    
    // 重置剩余材料相关选项
    document.getElementById('noRemainingMaterial').checked = true;
    document.getElementById('remainingMaterialInfo').classList.add('d-none');
    document.getElementById('remainingWeight').value = '';
    document.getElementById('remainingQuantity').value = '';
    document.getElementById('materialUsedUp').checked = true;
    
    // 设置生产按钮的计划ID
    document.getElementById('startProductionBtn').setAttribute('data-plan-id', planId);
    
    // 显示模态框
    productionModal.show();
}

// 执行生产
function executeProduction() {
    const planId = parseInt(document.getElementById('startProductionBtn').getAttribute('data-plan-id'));
    const plan = productionPlans.find(p => p.id === planId);
    
    const materialId = parseInt(document.getElementById('materialSelect').value);
    const material = materials.find(m => m.id === materialId);
    
    const productionQuantity = parseInt(document.getElementById('productionQuantity').value) || 1;
    
    if (!plan || !material) {
        alert('数据错误，请重试');
        return;
    }
    
    // 移除数量限制检查，允许超出计划数量
    if (productionQuantity <= 0) {
        alert('生产数量必须大于0');
        return;
    }
    
    // 更新计划状态
    if (productionQuantity >= plan.quantity) {
        plan.status = 'completed';
    } else {
        plan.status = 'in-progress';
    }
    
    // 创建或更新执行记录
    let execution = productionExecutions.find(e => e.planId === planId);
    
    if (!execution) {
        execution = {
            id: Date.now(),
            planId: planId,
            materialId: materialId,
            completedQuantity: productionQuantity,
            status: plan.status,
            startTime: new Date().toISOString()
        };
        productionExecutions.push(execution);
    } else {
        execution.completedQuantity += productionQuantity;
        execution.status = plan.status;
    }
    
    // 处理剩余材料
    const hasRemainingMaterial = document.getElementById('hasRemainingMaterial').checked;
    
    if (hasRemainingMaterial) {
        const remainingWeight = parseFloat(document.getElementById('remainingWeight').value) || 0;
        const remainingQuantity = document.getElementById('remainingQuantity').value;
        
        // 检查至少有一项不为空
        if ((remainingWeight > 0) || (remainingQuantity && parseInt(remainingQuantity) > 0)) {
            // 添加到物料库存
            const newMaterial = {
                id: Date.now() + 1,
                specification: material.specification,
                type: material.type,
                quantity: remainingQuantity ? parseInt(remainingQuantity) : null,
                weight: remainingWeight > 0 ? remainingWeight : null,
                materialDate: new Date().toLocaleDateString(),
                createdAt: new Date().toISOString(),
                status: '可使用'
            };
            
            materials.push(newMaterial);
        } else {
            alert('剩余材料至少需要填写重量或根数其中一项');
            return;
        }
    }
    
    // 更新原材料状态
    const materialUsedUp = document.getElementById('materialUsedUp').checked;
    if (materialUsedUp) {
        material.status = '已用完';
    }
    
    // 保存数据
    saveAllData();
    
    // 关闭模态框
    productionModal.hide();
    
    // 刷新页面数据
    loadProductionPlans();
    loadMaterials();
    loadDashboardData();
    
    alert('生产执行成功');
}

// 删除计划
function deletePlan(planId) {
    if (confirm('确定要删除此生产计划吗？')) {
        // 删除关联的执行记录
        productionExecutions = productionExecutions.filter(e => e.planId !== planId);
        
        // 删除计划
        productionPlans = productionPlans.filter(p => p.id !== planId);
        
        saveAllData();
        loadProductionPlans();
        loadDashboardData();
    }
}

// 删除物料
function deleteMaterial(materialId) {
    if (confirm('确定要删除此物料吗？')) {
        materials = materials.filter(m => m.id !== materialId);
        
        saveAllData();
        loadMaterials();
        loadDashboardData();
    }
}

// 保存所有数据
function saveAllData() {
    localStorage.setItem('productionPlans', JSON.stringify(productionPlans));
    localStorage.setItem('materials', JSON.stringify(materials));
    localStorage.setItem('productionExecutions', JSON.stringify(productionExecutions));
    localStorage.setItem('leftoverMaterials', JSON.stringify(leftoverMaterials));
}

// 辅助函数
function getStatusText(status) {
    const statusMap = {
        'pending': '待生产',
        'in-progress': '进行中',
        'completed': '已完成'
    };
    return statusMap[status] || status;
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (e) {
        return dateString; // 如果无法解析，直接返回原始字符串
    }
}

// 格式化规格和长度为一个统一格式
function formatSpecAndLength(specification, length) {
    const formattedLength = Number.isInteger(parseFloat(length)) ? length : parseFloat(length).toFixed(1);
    return `${specification}*${formattedLength}`;
}

// 生成唯一ID
function generateId() {
    return Date.now();
}

// 编辑生产计划
function editPlan(planId) {
    const plan = productionPlans.find(p => p.id === planId);
    if (!plan) {
        alert('生产计划不存在');
        return;
    }
    
    // 修改模态框标题
    document.getElementById('planModalTitle').textContent = '编辑生产计划';
    
    // 添加编辑模式样式
    document.querySelector('#addPlanModal .modal-header').classList.add('edit-mode');
    
    // 修改保存按钮文本
    const savePlanBtn = document.getElementById('savePlanBtn');
    savePlanBtn.textContent = '保存修改';
    
    // 填充表单
    document.getElementById('specification').value = plan.specification;
    document.getElementById('planType').value = plan.type;
    document.getElementById('length').value = plan.length;
    document.getElementById('quantity').value = plan.quantity;
    document.getElementById('planDate').value = plan.planDate || plan.createdAt.split('T')[0];
    
    // 记录当前编辑的ID
    savePlanBtn.setAttribute('data-edit-id', planId);
    
    // 修改保存按钮行为
    const originalClickHandler = savePlanBtn.onclick;
    savePlanBtn.onclick = function() {
        const editId = parseInt(this.getAttribute('data-edit-id'));
        savePlanEdit(editId);
        
        // 恢复原始处理函数和按钮文本
        savePlanBtn.onclick = originalClickHandler;
        savePlanBtn.removeAttribute('data-edit-id');
    };
    
    // 显示模态框
    addPlanModal.show();
}

// 保存生产计划编辑
function savePlanEdit(planId) {
    const specification = document.getElementById('specification').value;
    const type = document.getElementById('planType').value;
    const length = document.getElementById('length').value;
    const quantity = document.getElementById('quantity').value;
    const planDate = document.getElementById('planDate').value;
    
    if (!specification || !type || !length || !quantity || !planDate) {
        alert('请填写完整信息');
        return;
    }
    
    const plan = productionPlans.find(p => p.id === planId);
    if (plan) {
        plan.specification = specification;
        plan.type = type;
        plan.length = parseFloat(length);
        plan.quantity = parseInt(quantity);
        plan.planDate = planDate;
        
        localStorage.setItem('productionPlans', JSON.stringify(productionPlans));
        
        // 重置模态框标题和按钮文本
        document.getElementById('planModalTitle').textContent = '添加生产计划';
        document.getElementById('savePlanBtn').textContent = '保存';
        
        // 移除编辑模式样式
        document.querySelector('#addPlanModal .modal-header').classList.remove('edit-mode');
        
        addPlanModal.hide();
        document.getElementById('planForm').reset();
        
        loadProductionPlans();
        loadDashboardData();
        
        alert('生产计划已更新');
    }
}

// 编辑材料
function editMaterial(materialId) {
    const material = materials.find(m => m.id === materialId);
    if (!material) {
        alert('材料不存在');
        return;
    }
    
    // 修改模态框标题
    document.getElementById('materialModalTitle').textContent = '编辑材料';
    
    // 添加编辑模式样式
    document.querySelector('#addMaterialModal .modal-header').classList.add('edit-mode');
    
    // 修改保存按钮文本
    const saveMaterialBtn = document.getElementById('saveMaterialBtn');
    saveMaterialBtn.textContent = '保存修改';
    
    // 填充表单
    document.getElementById('materialSpec').value = material.specification;
    document.getElementById('materialType').value = material.type;
    document.getElementById('materialQuantity').value = material.quantity || '';
    document.getElementById('materialWeight').value = material.weight;
    document.getElementById('materialDate').value = material.materialDate || material.createdAt.split('T')[0];
    
    // 记录当前编辑的ID
    saveMaterialBtn.setAttribute('data-edit-id', materialId);
    
    // 添加状态选择
    let statusHtml = `
        <div class="mb-3" id="materialStatusGroup">
            <label class="form-label">材料状态</label>
            <select class="form-select" id="materialStatus">
                <option value="可用" ${material.status === '可用' ? 'selected' : ''}>可使用</option>
                <option value="已用完" ${material.status === '已用完' ? 'selected' : ''}>已用完</option>
            </select>
        </div>
    `;
    
    // 先移除可能存在的之前的状态选择
    const oldStatusGroup = document.getElementById('materialStatusGroup');
    if (oldStatusGroup) {
        oldStatusGroup.remove();
    }
    
    // 添加到表单中
    const weightGroup = document.getElementById('materialWeight').parentNode;
    weightGroup.insertAdjacentHTML('afterend', statusHtml);
    
    // 修改保存按钮行为
    const originalClickHandler = saveMaterialBtn.onclick;
    saveMaterialBtn.onclick = function() {
        const editId = parseInt(this.getAttribute('data-edit-id'));
        saveMaterialEdit(editId);
        
        // 恢复原始处理函数
        saveMaterialBtn.onclick = originalClickHandler;
        saveMaterialBtn.removeAttribute('data-edit-id');
        
        // 移除状态选择
        const statusGroup = document.getElementById('materialStatusGroup');
        if (statusGroup) {
            statusGroup.remove();
        }
    };
    
    // 显示模态框
    addMaterialModal.show();
}

// 保存材料编辑
function saveMaterialEdit(materialId) {
    const specification = document.getElementById('materialSpec').value;
    const type = document.getElementById('materialType').value;
    const quantity = document.getElementById('materialQuantity').value;
    const weight = document.getElementById('materialWeight').value;
    const materialDate = document.getElementById('materialDate').value;
    const status = document.getElementById('materialStatus').value;
    
    if (!specification || !type || !weight || !materialDate) {
        alert('请填写完整信息（根数可选填）');
        return;
    }
    
    const material = materials.find(m => m.id === materialId);
    if (material) {
        material.specification = specification;
        material.type = type;
        material.quantity = quantity ? parseInt(quantity) : null;
        material.weight = parseFloat(weight);
        material.materialDate = materialDate;
        material.status = status;
        
        localStorage.setItem('materials', JSON.stringify(materials));
        
        // 重置模态框标题和按钮文本
        document.getElementById('materialModalTitle').textContent = '添加材料';
        document.getElementById('saveMaterialBtn').textContent = '保存';
        
        // 移除编辑模式样式
        document.querySelector('#addMaterialModal .modal-header').classList.remove('edit-mode');
        
        addMaterialModal.hide();
        document.getElementById('materialForm').reset();
        
        // 移除状态选择
        const statusGroup = document.getElementById('materialStatusGroup');
        if (statusGroup) {
            statusGroup.remove();
        }
        
        loadMaterials();
        loadDashboardData();
        
        alert('材料已更新');
    }
}

// 添加生产计划
function addProductionPlan() {
    const specification = document.getElementById('specification').value.trim();
    const length = document.getElementById('length').value.trim();
    const type = document.getElementById('planType').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const planDate = document.getElementById('planDate').value;
    
    if (!specification || !length || !quantity) {
        alert('请填写完整的生产计划信息');
        return;
    }
    
    const newPlan = {
        id: generateId(),
        specification: specification,
        length: length,
        type: type,
        quantity: quantity,
        planDate: planDate || null,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    productionPlans.unshift(newPlan);
    saveProductionPlans();
    
    $('#addPlanModal').modal('hide');
    loadProductionPlans();
    loadDashboardData();
    
    // 清空表单
    document.getElementById('planForm').reset();
}

// 编辑生产计划
function editProductionPlan() {
    const planId = currentEditingPlanId;
    const plan = productionPlans.find(p => p.id === planId);
    
    if (!plan) {
        alert('生产计划不存在');
        return;
    }
    
    const specification = document.getElementById('specification').value.trim();
    const length = document.getElementById('length').value.trim();
    const type = document.getElementById('planType').value;
    const quantity = parseInt(document.getElementById('quantity').value);
    const planDate = document.getElementById('planDate').value;
    
    if (!specification || !length || !quantity) {
        alert('请填写完整的生产计划信息');
        return;
    }
    
    plan.specification = specification;
    plan.length = length;
    plan.type = type;
    plan.quantity = quantity;
    plan.planDate = planDate || null;
    
    saveProductionPlans();
    
    $('#editPlanModal').modal('hide');
    loadProductionPlans();
    loadDashboardData();
}

// 保存生产计划到本地存储
function saveProductionPlans() {
    localStorage.setItem('productionPlans', JSON.stringify(productionPlans));
}

// 筛选生产计划
function filterProductionPlans(status) {
    const rows = document.querySelectorAll('#productionTable tbody tr');
    
    rows.forEach(row => {
        const statusBadge = row.querySelector('.status-badge');
        const rowStatus = statusBadge ? statusBadge.classList.contains('status-' + status) : false;
        
        if (status === 'all' || rowStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    // 如果没有可显示的行，显示"无数据"提示
    const visibleRows = [...rows].filter(row => row.style.display !== 'none');
    if (visibleRows.length === 0) {
        document.getElementById('noProduction').classList.remove('d-none');
    } else {
        document.getElementById('noProduction').classList.add('d-none');
    }
}

// 筛选材料
function filterMaterials(status) {
    const rows = document.querySelectorAll('#materialsTable tbody tr');
    
    rows.forEach(row => {
        const statusBadge = row.querySelector('.status-badge');
        const statusText = statusBadge.textContent;
        
        if (status === 'all') {
            row.style.display = '';
        } else if (status === '可用' && statusText === '可使用') {
            // 兼容"可用"和"可使用"
            row.style.display = '';
        } else if (status === statusText) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
    
    // 如果没有可显示的行，显示"无数据"提示
    const visibleRows = [...rows].filter(row => row.style.display !== 'none');
    if (visibleRows.length === 0) {
        document.getElementById('noMaterials').classList.remove('d-none');
    } else {
        document.getElementById('noMaterials').classList.add('d-none');
    }
} 