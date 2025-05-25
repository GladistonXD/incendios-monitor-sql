// Import Leaflet library
const L = window.L

class OccurrenceSystemXAMPP {
  constructor() {
    this.API_BASE = "./api"
    this.currentStream = null
    this.capturedImage = null
    this.occurrences = []
    this.stats = { total: 0, resolved: 0, pending: 0, urgent: 0 }
    this.map = null
    this.markers = []

    this.initializeCamera()
    this.setupEventListeners()
    this.initializeMap()
    this.loadData()
    this.testConnection()
  }

  // === INICIALIZAÇÃO DO MAPA ===
  initializeMap() {
    try {
      // Inicializar mapa centrado no Brasil
      this.map = L.map("map").setView([-15.7942, -47.8822], 4)

      // Adicionar camada de tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map)

      this.showNotification("🗺️ Mapa carregado com sucesso!", "success")
    } catch (error) {
      console.error("Erro ao inicializar mapa:", error)
      this.showNotification("Erro ao carregar mapa", "error")
    }
  }

  // === ATUALIZAR MARCADORES NO MAPA ===
  updateMapMarkers() {
    // Limpar marcadores existentes
    this.markers.forEach((marker) => this.map.removeLayer(marker))
    this.markers = []

    // Adicionar novos marcadores
    this.occurrences.forEach((occurrence) => {
      if (occurrence.latitude && occurrence.longitude) {
        const lat = Number.parseFloat(occurrence.latitude)
        const lng = Number.parseFloat(occurrence.longitude)

        // Definir cor do marcador baseado no status e intensidade
        let markerColor = "red"
        if (occurrence.status === "Resolvido") {
          markerColor = "green"
        } else if (occurrence.priority === "urgente") {
          markerColor = "darkred"
        } else if (occurrence.priority === "alta") {
          markerColor = "orange"
        }

        // Criar ícone personalizado
        const fireIcon = L.divIcon({
          className: "custom-fire-icon",
          html: `<div style="
            background-color: ${markerColor}; 
            width: 20px; 
            height: 20px; 
            border-radius: 50%; 
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
          ">🔥</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        })

        // Criar marcador
        const marker = L.marker([lat, lng], { icon: fireIcon })
          .addTo(this.map)
          .bindPopup(`
            <div style="min-width: 200px;">
              <strong>🔥 Incêndio #${occurrence.id}</strong><br>
              <strong>Tipo:</strong> ${this.formatCategory(occurrence.category)}<br>
              <strong>Intensidade:</strong> ${this.formatPriority(occurrence.priority)}<br>
              <strong>Status:</strong> <span style="color: ${occurrence.status === "Resolvido" ? "green" : "red"}">${occurrence.status}</span><br>
              <strong>Data:</strong> ${this.formatDate(occurrence.created_at)}<br>
              <strong>Descrição:</strong> ${occurrence.comment.substring(0, 100)}${occurrence.comment.length > 100 ? "..." : ""}<br>
              <button onclick="window.occurrenceSystem.openDetailsModal(${occurrence.id})" 
                      style="background-color: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px; margin-top: 8px; cursor: pointer; border: none;">
                Ver Detalhes
              </button>
            </div>
          `)

        this.markers.push(marker)
      }
    })

    // Ajustar zoom para mostrar todos os marcadores
    if (this.markers.length > 0) {
      const group = new L.featureGroup(this.markers)
      this.map.fitBounds(group.getBounds(), { padding: [20, 20] })
    }
  }

  // === TESTE DE CONEXÃO ===
  async testConnection() {
    try {
      const response = await fetch(`${this.API_BASE}/stats.php`)
      if (response.ok) {
        this.showNotification("✅ Conexão com banco OK!", "success")
      } else {
        throw new Error("Erro na resposta")
      }
    } catch (error) {
      this.showNotification("❌ Erro de conexão com banco. Verifique XAMPP!", "error")
      console.error("Erro de conexão:", error)
    }
  }

  // === INICIALIZAÇÃO DA CÂMERA ===
  async initializeCamera() {
    try {
      // Tentar câmera traseira primeiro
      const constraints = {
        video: {
          facingMode: "environment", // Câmera traseira
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      }

      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (error) {
        // Se falhar, tentar câmera frontal
        console.warn("Câmera traseira não disponível, tentando frontal...")
        constraints.video.facingMode = "user"
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      }

      const video = document.getElementById("video")
      video.srcObject = stream
      video.classList.remove("hidden")
      document.getElementById("noCamera").classList.add("hidden")

      this.currentStream = stream
      this.showNotification("📸 Câmera conectada!", "success")
    } catch (error) {
      console.warn("Câmera não disponível:", error)
      document.getElementById("noCamera").classList.remove("hidden")
      this.showNotification("Câmera não disponível. Use 'Carregar Foto'.", "warning")
    }
  }

  setupEventListeners() {
    // Captura de imagem
    document.getElementById("captureBtn").addEventListener("click", () => this.captureImage())
    document.getElementById("uploadBtn").addEventListener("click", () => document.getElementById("imageUpload").click())
    document.getElementById("imageUpload").addEventListener("change", (e) => this.handleFileUpload(e))
    document.getElementById("cancelCaptureBtn").addEventListener("click", () => this.cancelCapture())

    // Formulário
    document.getElementById("occurrenceForm").addEventListener("submit", (e) => this.handleSubmit(e))

    // Filtros e ações
    document.getElementById("applyFilters").addEventListener("click", () => this.loadOccurrences())
    document.getElementById("refreshBtn").addEventListener("click", () => this.loadData())
    document.getElementById("testConnectionBtn").addEventListener("click", () => this.testConnection())
    document.getElementById("exportJSON").addEventListener("click", () => this.exportJSON())
    document.getElementById("exportCSV").addEventListener("click", () => this.exportCSV())

    // Modal
    document.querySelector(".close").addEventListener("click", () => {
      document.getElementById("detailsModal").style.display = "none"
    })

    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        e.target.style.display = "none"
      }
    })
  }

  // === CAPTURA DE IMAGEM ===
  captureImage() {
    const video = document.getElementById("video")
    if (!video.videoWidth) {
      this.showNotification("Câmera não está pronta", "error")
      return
    }

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext("2d")
    ctx.drawImage(video, 0, 0)

    this.capturedImage = canvas.toDataURL("image/jpeg", 0.8)
    this.showImagePreview()
  }

  handleFileUpload(event) {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        this.capturedImage = e.target.result
        this.showImagePreview()
      }
      reader.readAsDataURL(file)
    }
  }

  showImagePreview() {
    const preview = document.getElementById("capturePreview")
    const previewImage = document.getElementById("previewImage")
    const video = document.getElementById("video")
    const saveBtn = document.getElementById("saveBtn")

    previewImage.src = this.capturedImage
    preview.classList.remove("hidden")
    preview.classList.add("fade-in")
    video.classList.add("hidden")
    saveBtn.classList.remove("hidden")
  }

  cancelCapture() {
    const preview = document.getElementById("capturePreview")
    const video = document.getElementById("video")
    const saveBtn = document.getElementById("saveBtn")

    preview.classList.add("hidden")
    video.classList.remove("hidden")
    saveBtn.classList.add("hidden")
    this.capturedImage = null
  }

  // === ENVIO DE DADOS ===
  async handleSubmit(event) {
    event.preventDefault()

    if (!this.capturedImage) {
      this.showNotification("Por favor, capture ou selecione uma imagem", "error")
      return
    }

    const comment = document.getElementById("comment").value.trim()
    if (!comment) {
      this.showNotification("Por favor, adicione uma descrição", "error")
      return
    }

    const saveBtn = document.getElementById("saveBtn")
    saveBtn.disabled = true
    saveBtn.innerHTML = '<div class="loader mr-2"></div> Salvando...'

    try {
      // Tentar obter localização
      const position = await this.getCurrentPosition()

      const data = {
        image: this.capturedImage,
        comment: comment,
        category: document.getElementById("category").value,
        priority: document.getElementById("priority").value,
        latitude: position?.coords.latitude,
        longitude: position?.coords.longitude,
      }

      const response = await fetch(`${this.API_BASE}/occurrences.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        this.showSuccessMessage("Incêndio registrado com sucesso!")
        this.resetForm()
        this.loadData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao salvar")
      }
    } catch (error) {
      console.error("Erro:", error)
      this.showNotification("Erro ao salvar: " + error.message, "error")
    } finally {
      saveBtn.disabled = false
      saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Registrar Incêndio'
    }
  }

  getCurrentPosition() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
        timeout: 5000,
        enableHighAccuracy: true,
      })
    })
  }

  resetForm() {
    document.getElementById("occurrenceForm").reset()
    this.cancelCapture()
    document.getElementById("priority").value = "media"
  }

  // === CARREGAMENTO DE DADOS ===
  async loadData() {
    await Promise.all([this.loadOccurrences(), this.loadStats()])
  }

  async loadOccurrences() {
    try {
      this.showLoading(true)

      const filters = this.getFilters()
      const params = new URLSearchParams(filters)

      const response = await fetch(`${this.API_BASE}/occurrences.php?${params}`)
      if (response.ok) {
        this.occurrences = await response.json()
        this.renderOccurrences()
        this.updateMapMarkers()
      } else {
        throw new Error("Erro ao carregar ocorrências")
      }
    } catch (error) {
      console.error("Erro ao carregar ocorrências:", error)
      this.showNotification("Erro ao carregar dados: " + error.message, "error")
    } finally {
      this.showLoading(false)
    }
  }

  async loadStats() {
    try {
      const response = await fetch(`${this.API_BASE}/stats.php`)
      if (response.ok) {
        this.stats = await response.json()
        this.updateStatsDisplay()
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error)
    }
  }

  getFilters() {
    const filters = {}

    const status = document.getElementById("statusFilter").value
    const category = document.getElementById("categoryFilter").value
    const search = document.getElementById("searchFilter").value

    if (status) filters.status = status
    if (category) filters.category = category
    if (search) filters.search = search

    return filters
  }

  // === RENDERIZAÇÃO ===
  renderOccurrences() {
    const gallery = document.getElementById("gallery")
    const itemCount = document.getElementById("itemCount")
    const noItems = document.getElementById("noItems")

    itemCount.textContent = `${this.occurrences.length} ${this.occurrences.length === 1 ? "item" : "itens"}`

    if (this.occurrences.length === 0) {
      gallery.innerHTML = ""
      noItems.classList.remove("hidden")
      return
    }

    noItems.classList.add("hidden")

    gallery.innerHTML = this.occurrences
      .map(
        (occurrence) => `
      <div class="bg-gray-50 rounded-lg shadow p-4 fade-in" data-id="${occurrence.id}">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="md:w-1/3">
            <img src="${occurrence.image}" alt="Incêndio" class="w-full h-48 object-cover rounded-lg cursor-pointer" 
                 onclick="window.occurrenceSystem.openDetailsModal(${occurrence.id})">
          </div>
          <div class="md:w-2/3">
            <div class="flex flex-wrap gap-2 mb-3">
              <span class="status-badge ${occurrence.status === "Resolvido" ? "bg-green-600" : "bg-red-600"} text-white text-xs px-2 py-1 rounded" 
                    onclick="window.occurrenceSystem.toggleStatus(${occurrence.id}, '${occurrence.status}')">
                ${occurrence.status === "Resolvido" ? "Controlado" : "Ativo"}
              </span>
              <span class="bg-orange-600 text-white text-xs px-2 py-1 rounded">
                ${this.formatPriority(occurrence.priority)}
              </span>
              <span class="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">
                ${this.formatCategory(occurrence.category)}
              </span>
            </div>
            
            <p class="text-gray-700 mb-3">${occurrence.comment}</p>
            
            <div class="text-sm text-gray-500 mb-3">
              <p><i class="fas fa-calendar-alt mr-1"></i> ${this.formatDate(occurrence.created_at)}</p>
              <p><i class="fas fa-key mr-1"></i> ID: ${occurrence.id}</p>
              ${
                occurrence.latitude && occurrence.longitude
                  ? `<p><i class="fas fa-map-marker-alt mr-1"></i> ${Number.parseFloat(occurrence.latitude).toFixed(6)}, ${Number.parseFloat(occurrence.longitude).toFixed(6)}</p>`
                  : '<p><i class="fas fa-map-marker-alt mr-1"></i> Sem localização</p>'
              }
            </div>
            
            <div class="flex gap-2">
              <button class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-500" 
                      onclick="window.occurrenceSystem.openDetailsModal(${occurrence.id})">
                <i class="fas fa-eye mr-1"></i> Ver Detalhes
              </button>
              <button class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-500" 
                      onclick="window.occurrenceSystem.deleteOccurrence(${occurrence.id})">
                <i class="fas fa-trash mr-1"></i> Excluir
              </button>
            </div>
          </div>
        </div>
      </div>
    `,
      )
      .join("")
  }

  updateStatsDisplay() {
    document.getElementById("totalCount").textContent = this.stats.total
    document.getElementById("resolvedCount").textContent = this.stats.resolved
    document.getElementById("pendingCount").textContent = this.stats.pending
    document.getElementById("urgentCount").textContent = this.stats.urgent
  }

  // === MODAL DE DETALHES ===
  openDetailsModal(id) {
    const occurrence = this.occurrences.find((o) => o.id == id)
    if (!occurrence) return

    const modal = document.getElementById("detailsModal")
    const modalContent = document.getElementById("modalContent")

    modalContent.innerHTML = `
      <div class="space-y-4">
        <img src="${occurrence.image}" alt="Incêndio" class="w-full rounded-lg max-h-96 object-cover">
        
        <div class="flex flex-wrap gap-2">
          <span class="status-badge ${occurrence.status === "Resolvido" ? "bg-green-600" : "bg-red-600"} text-white text-xs px-2 py-1 rounded" 
                onclick="window.occurrenceSystem.toggleStatus(${occurrence.id}, '${occurrence.status}')">
            ${occurrence.status === "Resolvido" ? "Controlado" : "Ativo"}
          </span>
          <span class="bg-orange-600 text-white text-xs px-2 py-1 rounded">
            ${this.formatPriority(occurrence.priority)}
          </span>
          <span class="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded">
            ${this.formatCategory(occurrence.category)}
          </span>
        </div>
        
        <div>
          <h3 class="font-medium text-gray-800">Descrição</h3>
          <p class="text-gray-700">${occurrence.comment}</p>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h3 class="font-medium text-gray-800">Data e Hora</h3>
            <p class="text-gray-700">${this.formatDate(occurrence.created_at, true)}</p>
          </div>
          <div>
            <h3 class="font-medium text-gray-800">ID</h3>
            <p class="text-gray-700">${occurrence.id}</p>
          </div>
        </div>
        
        ${
          occurrence.latitude && occurrence.longitude
            ? `
          <div>
            <h3 class="font-medium text-gray-800">Localização</h3>
            <p class="text-gray-700">Latitude: ${Number.parseFloat(occurrence.latitude).toFixed(6)}</p>
            <p class="text-gray-700">Longitude: ${Number.parseFloat(occurrence.longitude).toFixed(6)}</p>
            <div id="detailMap" class="h-48 w-full rounded-lg mt-2"></div>
          </div>
        `
            : ""
        }
      </div>
    `

    modal.style.display = "block"

    // Inicializar mapa do modal se houver coordenadas
    if (occurrence.latitude && occurrence.longitude) {
      setTimeout(() => {
        const lat = Number.parseFloat(occurrence.latitude)
        const lng = Number.parseFloat(occurrence.longitude)

        const detailMap = L.map("detailMap").setView([lat, lng], 15)
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(detailMap)

        // Adicionar marcador
        const fireIcon = L.divIcon({
          className: "custom-fire-icon",
          html: `<div style="
            background-color: red; 
            width: 20px; 
            height: 20px; 
            border-radius: 50%; 
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
          ">🔥</div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        })

        L.marker([lat, lng], { icon: fireIcon }).addTo(detailMap)
      }, 300)
    }
  }

  // === AÇÕES ===
  async toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === "Resolvido" ? "Não resolvido" : "Resolvido"

    try {
      const response = await fetch(`${this.API_BASE}/occurrences.php?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        this.showSuccessMessage("Status atualizado!")
        this.loadData()

        // Fechar modal se estiver aberto
        document.getElementById("detailsModal").style.display = "none"
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao atualizar status")
      }
    } catch (error) {
      this.showNotification("Erro ao atualizar status: " + error.message, "error")
    }
  }

  async deleteOccurrence(id) {
    if (!confirm("Tem certeza que deseja excluir este registro de incêndio?")) return

    try {
      const response = await fetch(`${this.API_BASE}/occurrences.php?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        this.showSuccessMessage("Registro excluído!")
        this.loadData()

        // Fechar modal se estiver aberto
        document.getElementById("detailsModal").style.display = "none"
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao excluir")
      }
    } catch (error) {
      this.showNotification("Erro ao excluir: " + error.message, "error")
    }
  }

  // === EXPORTAÇÃO ===
  exportJSON() {
    const dataStr = JSON.stringify(this.occurrences, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
    const exportFileDefaultName = `incendios_${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  exportCSV() {
    let csv = "ID,Data,Comentário,Status,Tipo,Intensidade,Latitude,Longitude\n"

    this.occurrences.forEach((item) => {
      const row = [
        item.id,
        this.formatDate(item.created_at),
        `"${item.comment.replace(/"/g, '""')}"`,
        item.status,
        this.formatCategory(item.category),
        this.formatPriority(item.priority),
        item.latitude || "",
        item.longitude || "",
      ]
      csv += row.join(",") + "\n"
    })

    const dataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
    const exportFileDefaultName = `incendios_${new Date().toISOString().slice(0, 10)}.csv`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // === UTILITÁRIOS ===
  formatDate(dateString, includeTime = false) {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
    }

    if (includeTime) {
      options.hour = "2-digit"
      options.minute = "2-digit"
    }

    return new Date(dateString).toLocaleDateString("pt-BR", options)
  }

  formatCategory(category) {
    const categories = {
      vegetacao: "Vegetação/Mata",
      residencial: "Residencial",
      comercial: "Comercial/Industrial",
      veiculo: "Veículo",
      lixo: "Lixo/Entulho",
      outros: "Outros",
    }
    return categories[category] || category
  }

  formatPriority(priority) {
    const priorities = {
      baixa: "Pequeno Foco",
      media: "Foco Médio",
      alta: "Grande Incêndio",
      urgente: "Incêndio Crítico",
    }
    return priorities[priority] || priority
  }

  showLoading(show) {
    const loading = document.getElementById("loading")
    const gallery = document.getElementById("gallery")

    if (show) {
      loading.classList.remove("hidden")
      gallery.classList.add("hidden")
    } else {
      loading.classList.add("hidden")
      gallery.classList.remove("hidden")
    }
  }

  showSuccessMessage(message) {
    const successDiv = document.getElementById("successMessage")
    const successText = document.getElementById("successText")

    successText.textContent = message
    successDiv.style.display = "block"

    setTimeout(() => {
      successDiv.style.display = "none"
    }, 3000)
  }

  showNotification(message, type = "info") {
    const notification = document.getElementById("notification")
    const notificationMessage = document.getElementById("notificationMessage")

    notification.className = "fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50"

    switch (type) {
      case "success":
        notification.classList.add("bg-green-600", "text-white")
        break
      case "error":
        notification.classList.add("bg-red-600", "text-white")
        break
      case "warning":
        notification.classList.add("bg-yellow-600", "text-white")
        break
      default:
        notification.classList.add("bg-blue-600", "text-white")
    }

    notificationMessage.textContent = message
    notification.classList.remove("hidden")

    setTimeout(() => {
      notification.classList.add("hidden")
    }, 4000)
  }
}

// Inicializar sistema quando página carregar
document.addEventListener("DOMContentLoaded", () => {
  window.occurrenceSystem = new OccurrenceSystemXAMPP()
})
