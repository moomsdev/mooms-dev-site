/**
 * Bulk Image Optimization Script
 * Handles bulk optimization, image selection, and restore functionality
 */

// Chỉ import debounce function, không import toàn bộ lodash để tránh conflict với Underscore.js của WordPress
import debounce from 'lodash/debounce';

(function($) {
    'use strict';

    const MMS_BulkOptimize = {
        isRunning: false,
        currentOffset: 0,
        totalOptimized: 0,
        totalProcessed: 0,
        totalImages: 0,
        swalInstance: null,

        init: function() {
            this.bindEvents();
        },

        bindEvents: function() {
            // Bulk optimize buttons
            $('#mms-start-bulk-optimize').on('click', () => this.startBulkOptimize());
            $('#mms-stop-bulk-optimize').on('click', () => this.stopBulkOptimize());
            $('#mms-reset-bulk-optimize').on('click', () => this.resetBulkOptimize());

            // Select images button
            $('#mms-select-images-btn').on('click', () => this.openImageSelector());
            
            // Bulk restore button
            $('#mms-bulk-restore-btn').on('click', () => this.startBulkRestore());
        },

        checkSwal: function(callback) {
            if (typeof Swal !== 'undefined') {
                callback();
            } else {
                setTimeout(() => this.checkSwal(callback), 100);
            }
        },

        startBulkOptimize: function() {
            if (this.isRunning) return;

            this.checkSwal(() => {
                const minKB = parseInt($('#bulk-min-kb').val()) || 500;
                const batchSize = parseInt($('#bulk-batch-size').val()) || 50;

                if (minKB < 1 || batchSize < 1) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi',
                        text: 'Vui lòng nhập giá trị hợp lệ!',
                        confirmButtonText: 'OK'
                    });
                    return;
                }

                // Reset state
                this.currentOffset = 0;
                this.totalOptimized = 0;
                this.totalProcessed = 0;
                this.totalImages = 0;
                this.isRunning = true;

                // Show SweetAlert2 with progress
                this.swalInstance = Swal.fire({
                    title: 'Đang tối ưu hình ảnh...',
                    html: `
                        <div style="text-align: center;">
                            <div style="margin: 20px 0;">
                                <div style="background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0;">
                                    <div id="swal-progress-bar" style="background: linear-gradient(90deg, #4CAF50, #45a049); height: 100%; width: 0%; transition: width 0.3s ease; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">0%</div>
                                </div>
                            </div>
                            <div id="swal-progress-text" style="font-weight: 600; margin: 10px 0;">Đang quét hình ảnh...</div>
                            <div style="font-size: 14px; color: #666; margin-top: 15px;">
                                <i class="fa-solid fa-info-circle"></i> Đang xử lý ảnh lớn hơn ${minKB}KB, mỗi lần ${batchSize} ảnh
                            </div>
                        </div>
                    `,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showConfirmButton: false,
                    showCancelButton: true,
                    cancelButtonText: 'Dừng',
                    didOpen: () => {
                        $('#mms-start-bulk-optimize').hide();
                        $('#mms-stop-bulk-optimize').show();
                    }
                });

                // Handle cancel button
                this.swalInstance.then((result) => {
                    if (result.dismiss === Swal.DismissReason.cancel) {
                        this.isRunning = false;
                        $('#mms-start-bulk-optimize').show();
                        $('#mms-stop-bulk-optimize').hide();
                    }
                });

                // Start processing
                this.processBatch(minKB, batchSize);
            });
        },

        processBatch: function(minKB, batchSize) {
            if (!this.isRunning) return;

            $.ajax({
                url: window.mmsBulkOptimize.ajaxurl || ajaxurl,
                type: 'POST',
                data: {
                    action: 'mms_bulk_optimize_images',
                    nonce: window.mmsBulkOptimize.nonce,
                    confirm: 'yes',
                    min_kb: minKB,
                    limit: batchSize,
                    offset: this.currentOffset
                },
                success: (response) => {
                    if (response.success && response.data) {
                        const data = response.data;
                        this.totalOptimized += data.optimized;
                        this.totalProcessed += data.processed;
                        this.totalImages = data.total;
                        this.currentOffset = data.next_offset;

                        // Update SweetAlert2 progress
                        const progressPercent = this.totalImages > 0 ? Math.round((this.totalProcessed / this.totalImages) * 100) : 0;
                        $('#swal-progress-bar').css('width', progressPercent + '%').text(progressPercent + '%');
                        $('#swal-progress-text').html(
                            `Đang nén: ${this.totalProcessed}/${this.totalImages} ảnh | Đã tối ưu: ${this.totalOptimized} ảnh`
                        );

                        if (data.done || !this.isRunning) {
                            // Finished - Show completion dialog
                            this.isRunning = false;
                            $('#mms-start-bulk-optimize').show();
                            $('#mms-stop-bulk-optimize').hide();

                            // Close progress dialog and show completion
                            if (this.swalInstance) {
                                this.swalInstance.close();
                            }

                            Swal.fire({
                                icon: 'success',
                                title: 'Hoàn thành!',
                                html: `
                                    <div style="text-align: left;">
                                        <p><strong>Tổng kết tối ưu hóa:</strong></p>
                                        <ul style="margin: 15px 0; padding-left: 20px;">
                                            <li>📊 Đã xử lý: <strong>${this.totalProcessed}</strong> ảnh</li>
                                            <li>✅ Đã tối ưu: <strong>${this.totalOptimized}</strong> ảnh</li>
                                            <li>⏭️ Đã bỏ qua: <strong>${this.totalProcessed - this.totalOptimized}</strong> ảnh (đã tối ưu trước đó)</li>
                                            <li>📈 Tỷ lệ tối ưu: <strong>${this.totalProcessed > 0 ? Math.round((this.totalOptimized / this.totalProcessed) * 100) : 0}%</strong></li>
                                        </ul>
                                        <div style="background: #e8f5e8; padding: 10px; border-radius: 5px; margin-top: 15px;">
                                            <i class="fa-solid fa-check-circle" style="color: #4CAF50;"></i> 
                                            Quá trình tối ưu hóa đã hoàn thành thành công!
                                        </div>
                                    </div>
                                `,
                                confirmButtonText: 'OK',
                                confirmButtonColor: '#4CAF50'
                            });

                        } else {
                            // Continue with next batch
                            setTimeout(() => this.processBatch(minKB, batchSize), 1000);
                        }
                    } else {
                        // Error
                        this.isRunning = false;
                        $('#mms-start-bulk-optimize').show();
                        $('#mms-stop-bulk-optimize').hide();

                        // Close progress dialog and show error
                        if (this.swalInstance) {
                            this.swalInstance.close();
                        }

                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi!',
                            text: response.data?.message || 'Có lỗi xảy ra trong quá trình tối ưu hóa',
                            confirmButtonText: 'OK'
                        });
                    }
                },
                error: (xhr, status, error) => {
                    this.isRunning = false;
                    $('#mms-start-bulk-optimize').show();
                    $('#mms-stop-bulk-optimize').hide();

                    // Close progress dialog and show error
                    if (this.swalInstance) {
                        this.swalInstance.close();
                    }

                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi AJAX!',
                        text: 'Không thể kết nối đến server: ' + error,
                        confirmButtonText: 'OK'
                    });
                }
            });
        },

        stopBulkOptimize: function() {
            this.isRunning = false;
            if (this.swalInstance) {
                this.swalInstance.close();
            }
            $('#mms-start-bulk-optimize').show();
            $('#mms-stop-bulk-optimize').hide();
        },

        resetBulkOptimize: function() {
            this.isRunning = false;
            this.currentOffset = 0;
            this.totalOptimized = 0;
            this.totalProcessed = 0;
            this.totalImages = 0;

            if (this.swalInstance) {
                this.swalInstance.close();
            }

            $('#mms-bulk-progress').hide();
            $('#mms-bulk-results').hide();
            $('#mms-bulk-error').hide();
            $('#mms-start-bulk-optimize').show();
            $('#mms-stop-bulk-optimize').hide();
        },

        openImageSelector: function() {
            console.log('openImageSelector called');
            this.checkSwal(() => {
                console.log('Swal is ready, opening modal...');
                const self = this; // Preserve context
                
                Swal.fire({
                    title: 'Chọn ảnh để tối ưu',
                    html: `
                        <div id="mms-image-selector-content" style="min-height: 400px;">
                            <div style="margin: 10px 0;">
                                <input type="text" id="mms-search-images" placeholder="Tìm kiếm..." style="width: 100%; padding: 8px; margin-bottom: 10px;">
                                <label style="display: inline-block; margin-right: 15px;">
                                    <input type="checkbox" id="mms-filter-unoptimized"> Chỉ hiển thị ảnh chưa tối ưu
                                </label>
                                <label style="display: inline-block;">
                                    Kích thước tối thiểu: <input type="number" id="mms-filter-minsize" value="0" style="width: 80px; padding: 4px;"> KB
                                </label>
                            </div>
                            <div id="mms-images-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; max-height: 400px; overflow-y: auto; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                                <div style="text-align: center; grid-column: 1 / -1;">
                                    <i class="fa-solid fa-spinner fa-spin"></i> Đang tải...
                                </div>
                            </div>
                        </div>
                    `,
                    width: '800px',
                    showDenyButton: true,
                    showCancelButton: true,
                    confirmButtonText: 'Tối ưu đã chọn',
                    denyButtonText: 'Restore đã chọn',
                    cancelButtonText: 'Đóng',
                    confirmButtonColor: '#3085d6',
                    denyButtonColor: '#d33',
                    didOpen: () => {
                        console.log('Modal didOpen - loading images...');
                        self.loadImagesList();
                        $('#mms-filter-unoptimized, #mms-filter-minsize').on('change', () => {
                            console.log('Filter changed');
                            self.loadImagesList();
                        });
                        $('#mms-search-images').on('keyup', debounce(() => {
                            console.log('Search changed');
                            self.loadImagesList();
                        }, 500));
                    },
                    preConfirm: () => {
                        const selected = [];
                        $('#mms-images-grid input[type="checkbox"]:checked').each(function() {
                            selected.push(parseInt($(this).val()));
                        });
                        console.log('Selected images for optimize:', selected);
                        if (selected.length === 0) {
                            Swal.showValidationMessage('Vui lòng chọn ít nhất 1 ảnh');
                            return false;
                        }
                        return selected;
                    },
                    preDeny: () => {
                        const selected = [];
                        $('#mms-images-grid input[type="checkbox"]:checked').each(function() {
                            selected.push(parseInt($(this).val()));
                        });
                        console.log('Selected images for restore:', selected);
                        if (selected.length === 0) {
                            Swal.showValidationMessage('Vui lòng chọn ít nhất 1 ảnh');
                            return false;
                        }
                        return selected;
                    }
                }).then((result) => {
                    if (result.isConfirmed && result.value) {
                        console.log('Confirmed, optimizing:', result.value);
                        self.optimizeSelectedImages(result.value);
                    } else if (result.isDenied && result.value) {
                        console.log('Denied (Restore), restoring:', result.value);
                        self.restoreSelectedImages(result.value);
                    }
                });
            });
        },

        loadImagesList: function(page = 1) {
            console.log('loadImagesList called, page:', page);
            const unoptimizedOnly = $('#mms-filter-unoptimized').is(':checked');
            const minKB = parseInt($('#mms-filter-minsize').val()) || 0;
            
            console.log('Filters:', { unoptimizedOnly, minKB });
            console.log('AJAX URL:', window.mmsBulkOptimize.ajaxurl || ajaxurl);
            console.log('Nonce:', window.mmsBulkOptimize.nonce_list);

            $.ajax({
                url: window.mmsBulkOptimize.ajaxurl || ajaxurl,
                type: 'POST',
                data: {
                    action: 'mms_get_images_list',
                    nonce: window.mmsBulkOptimize.nonce_list,
                    page: page,
                    per_page: 20,
                    min_kb: minKB
                },
                beforeSend: function() {
                    console.log('AJAX request starting...');
                },
                success: (response) => {
                    console.log('loadImagesList response:', response);
                    if (response.success && response.data) {
                        console.log('Total images from server:', response.data.images.length);
                        console.log('Unoptimized filter:', unoptimizedOnly);
                        let html = '';
                        let visibleCount = 0;
                        response.data.images.forEach((img) => {
                            if (unoptimizedOnly && img.is_optimized) {
                                console.log('Skipping optimized image:', img.id, img.title);
                                return;
                            }
                            visibleCount++;

                            const badgeColor = img.is_optimized ? '#4CAF50' : '#ff9800';
                            const badgeText = img.is_optimized ? 'Đã tối ưu' : 'Chưa tối ưu';

                            html += `
                                <div class="mms-image-item" style="position: relative; border: 1px solid #ddd; border-radius: 5px; padding: 5px; text-align: center;">
                                    <label style="cursor: pointer; display: block;">
                                        <input type="checkbox" value="${img.id}" style="position: absolute; top: 5px; left: 5px; z-index: 1;">
                                        <img src="${img.thumb}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 3px; margin-bottom: 5px;">
                                        <div style="font-size: 11px; margin-top: 5px;">
                                            <strong>${img.size_kb} KB</strong>
                                            <span style="display: inline-block; background: ${badgeColor}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-top: 3px;">${badgeText}</span>
                                            ${img.saved ? `<br><small style="color: #4CAF50;">Tiết kiệm: ${img.saved}</small>` : ''}
                                        </div>
                                    </label>
                                    ${img.has_backup ? `
                                        <button type="button" class="mms-restore-btn" data-id="${img.id}" style="width: 100%; margin-top: 5px; padding: 3px; font-size: 11px; background: #f44336; color: white; border: none; border-radius: 3px; cursor: pointer;">
                                            <i class="fa-solid fa-undo"></i> Restore
                                        </button>
                                    ` : ''}
                                </div>
                            `;
                        });

                        console.log('Visible images after filter:', visibleCount);
                        if (html === '') {
                            html = '<div style="text-align: center; grid-column: 1 / -1; padding: 20px; color: #666;">Không tìm thấy ảnh nào</div>';
                        }

                        $('#mms-images-grid').html(html);

                        // Bind restore buttons
                        $('.mms-restore-btn').on('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            MMS_BulkOptimize.restoreImage(parseInt($(this).data('id')));
                        });
                    } else {
                        console.error('Failed to load images:', response);
                        $('#mms-images-grid').html('<div style="text-align: center; grid-column: 1 / -1; color: #f44336;">Lỗi: ' + (response.data?.message || 'Không thể tải ảnh') + '</div>');
                    }
                },
                error: (xhr, status, error) => {
                    console.error('AJAX error loading images:', xhr, status, error);
                    $('#mms-images-grid').html('<div style="text-align: center; grid-column: 1 / -1; color: #f44336;">Lỗi AJAX khi tải danh sách ảnh: ' + error + '</div>');
                }
            });
        },

        optimizeSelectedImages: function(ids) {
            Swal.fire({
                title: 'Đang tối ưu...',
                html: `<div>Đang xử lý ${ids.length} ảnh...</div>`,
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            $.ajax({
                url: window.mmsBulkOptimize.ajaxurl || ajaxurl,
                type: 'POST',
                data: {
                    action: 'mms_optimize_selected',
                    nonce: window.mmsBulkOptimize.nonce_selected,
                    ids: ids
                },
                success: (response) => {
                    if (response.success && response.data) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Hoàn thành!',
                            html: `
                                <p>Đã tối ưu thành công <strong>${response.data.optimized}</strong> / ${response.data.total} ảnh</p>
                                ${response.data.failed > 0 ? `<p style="color: #f44336;">Thất bại: ${response.data.failed} ảnh</p>` : ''}
                            `,
                            confirmButtonText: 'OK'
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi!',
                            text: response.data?.message || 'Có lỗi xảy ra',
                            confirmButtonText: 'OK'
                        });
                    }
                },
                error: () => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi AJAX!',
                        text: 'Không thể kết nối đến server',
                        confirmButtonText: 'OK'
                    });
                }
            });
        },

        restoreImage: function(id) {
            console.log('restoreImage called for ID:', id);
            const self = this;
            
            Swal.fire({
                title: 'Xác nhận restore?',
                text: 'Bạn có chắc muốn khôi phục ảnh gốc không?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Restore',
                cancelButtonText: 'Hủy'
            }).then((result) => {
                if (result.isConfirmed) {
                    console.log('Restore confirmed, sending AJAX...');
                    $.ajax({
                        url: window.mmsBulkOptimize.ajaxurl || ajaxurl,
                        type: 'POST',
                        data: {
                            action: 'mms_restore_image',
                            nonce: window.mmsBulkOptimize.nonce_restore,
                            attachment_id: id
                        },
                        success: (response) => {
                            console.log('Restore response:', response);
                            if (response.success) {
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Đã khôi phục!',
                                    text: response.data?.message || 'Ảnh đã được khôi phục về trạng thái ban đầu',
                                    confirmButtonText: 'OK'
                                }).then(() => {
                                    console.log('Reloading images list...');
                                    // Reload images list if modal is open
                                    if ($('#mms-images-grid').length) {
                                        self.loadImagesList();
                                    }
                                });
                            } else {
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Lỗi!',
                                    text: response.data?.message || 'Không thể restore ảnh',
                                    confirmButtonText: 'OK'
                                });
                            }
                        },
                        error: (xhr, status, error) => {
                            console.error('Restore AJAX error:', xhr, status, error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Lỗi AJAX!',
                                text: 'Không thể kết nối server: ' + error,
                                confirmButtonText: 'OK'
                            });
                        }
                    });
                }
            });
        },
        
        restoreSelectedImages: function(imageIds) {
            console.log('restoreSelectedImages called with:', imageIds);
            const self = this;
            
            this.checkSwal(() => {
                Swal.fire({
                    title: 'Đang restore...',
                    html: `<p>Đang restore <strong>${imageIds.length}</strong> ảnh...</p><p id="restore-progress">0/${imageIds.length}</p>`,
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                        self.processRestoreSelected(imageIds, 0);
                    }
                });
            });
        },
        
        processRestoreSelected: function(imageIds, index) {
            const self = this;
            const total = imageIds.length;
            
            if (index >= total) {
                // Done
                Swal.fire({
                    icon: 'success',
                    title: 'Hoàn thành!',
                    html: `<p>Đã restore thành công <strong>${total}</strong> ảnh!</p>`,
                    confirmButtonText: 'OK'
                });
                return;
            }
            
            const imageId = imageIds[index];
            
            // Update progress
            $('#restore-progress').text(`${index + 1}/${total}`);
            
            $.ajax({
                url: window.mmsBulkOptimize.ajaxurl || ajaxurl,
                type: 'POST',
                data: {
                    action: 'mms_restore_image',
                    nonce: window.mmsBulkOptimize.nonce_restore,
                    attachment_id: imageId
                },
                success: (response) => {
                    console.log(`Restore image ${imageId}:`, response.success ? 'OK' : 'Failed');
                    // Continue with next image
                    setTimeout(() => self.processRestoreSelected(imageIds, index + 1), 300);
                },
                error: (xhr, status, error) => {
                    console.error(`Restore image ${imageId} error:`, error);
                    // Continue with next image even if error
                    setTimeout(() => self.processRestoreSelected(imageIds, index + 1), 300);
                }
            });
        },
        
        startBulkRestore: function() {
            if (this.isRunning) return;
            
            const self = this;
            
            this.checkSwal(() => {
                Swal.fire({
                    title: 'Xác nhận restore tất cả?',
                    html: '<p>Bạn có chắc muốn khôi phục <strong>TẤT CẢ</strong> ảnh đã tối ưu về bản gốc không?</p><p style="color: red;">Hành động này KHÔNG THỂ hoàn tác!</p>',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Restore tất cả',
                    cancelButtonText: 'Hủy',
                    confirmButtonColor: '#d33'
                }).then((result) => {
                    if (result.isConfirmed) {
                        self.isRunning = true;
                        self.currentOffset = 0;
                        self.totalProcessed = 0;
                        self.totalRestored = 0;
                        
                        self.processBulkRestore();
                    }
                });
            });
        },
        
        processBulkRestore: function() {
            const self = this;
            const batchSize = 50;
            
            $.ajax({
                url: window.mmsBulkOptimize.ajaxurl || ajaxurl,
                type: 'POST',
                data: {
                    action: 'mms_bulk_restore_images',
                    nonce: window.mmsBulkOptimize.nonce_bulk_restore,
                    offset: self.currentOffset,
                    limit: batchSize
                },
                success: (response) => {
                    if (response.success) {
                        const data = response.data;
                        self.totalRestored += data.restored;
                        self.totalProcessed += (data.restored + data.failed);
                        self.currentOffset = data.next_offset;
                        
                        console.log('Bulk restore progress:', {
                            restored: data.restored,
                            failed: data.failed,
                            total: data.total,
                            done: data.done
                        });
                        
                        if (!data.done && self.isRunning) {
                            // Continue processing
                            setTimeout(() => self.processBulkRestore(), 500);
                        } else {
                            // Done
                            self.isRunning = false;
                            
                            Swal.fire({
                                icon: 'success',
                                title: 'Hoàn thành!',
                                html: `
                                    <p><strong>Tổng kết restore hàng loạt:</strong></p>
                                    <p>✅ Đã restore: <strong>${self.totalRestored}</strong> ảnh</p>
                                    <p>❌ Thất bại: <strong>${self.totalProcessed - self.totalRestored}</strong> ảnh</p>
                                    <p style="color: green; margin-top: 15px;">Quá trình restore đã hoàn thành thành công!</p>
                                `,
                                confirmButtonText: 'OK'
                            });
                        }
                    } else {
                        self.isRunning = false;
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi!',
                            text: response.data?.message || 'Không thể restore',
                            confirmButtonText: 'OK'
                        });
                    }
                },
                error: (xhr, status, error) => {
                    self.isRunning = false;
                    console.error('Bulk restore error:', xhr, status, error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi AJAX!',
                        text: 'Không thể kết nối server: ' + error,
                        confirmButtonText: 'OK'
                    });
                }
            });
        }
    };

    // Initialize on document ready
    $(document).ready(function() {
        MMS_BulkOptimize.init();
    });

    // Expose to window
    window.MMS_BulkOptimize = MMS_BulkOptimize;

})(jQuery);

