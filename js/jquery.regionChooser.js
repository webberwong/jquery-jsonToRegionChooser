/**
 * 地区选择器jQuery插件
 * todo 地区数据一次请求,共用; 性能优化,把数据按地区类型进行拆分,查询时使用拆分的数据
 * @author Hwl<weigewong@gmail.com>
 */
(function($){
    $.fn.regionChooser = function(options){
        //多个同时使用
        $.each(this,function(idx,_regionInput){
            var opts = {
                dataUrl : '/index.php/Home/Public/getRegionList',
                //表示中国
                defaultCountry : '86',
                //显示级别 , 4级,国家0,省1,市2,3县区
                showLevel : [0,1,2,3],
                //值是标识在标签的哪个属性里
                val_attr : 'value',
                //选择标签的样式名
                class_name : 'form-control',
                //显示的key值
                nameKey  : 'regionName',
                //分类选项的值
                valueKey : 'regionId',
                //子分类的key值
                subKey   : '_child',
                //默认选项
                defaultOpts : [
                    {
                        name  : '-----请选择国家-----',
                        value : '0'
                    },
                    {
                        name  : '-----请选择省份-----',
                        value : '0'
                    },
                    {
                        name  : '-----请选择城市-----',
                        value : '0'
                    },
                    {
                        name  : '-----请选择县区-----',
                        value : '0'
                    }
                ],

                wrapJqDom : $('<div class="col-md-3"></div>')

            };

            var _this = $(this);
            opts.regionValue = getValue();

            var regionData = [];
            var locations  = [];
            var $parent    = _this.parent();
            //储存生成的jquery select对象
            var sltArray  = [];

            opts = $.extend(opts,options);

            /**
             * 生成控件
             */
            function generateRegionView (){
                getRegionData();
            };

            /**
             * 分析当前地址的编辑为数组
             * @param curRegion
             * @return array
             */
            function parseCurRegion(curRegion){
                var locations = curRegion.split('-');
                var difLength = 4 - locations.length;
                //如果有值的情况下
                if(difLength > 0 && difLength < 4){
                    for(var i = 0; i < difLength; i++){
                        var _region = queryOne(locations[0]);
                        locations.unshift(_region['parentId']);
                    }
                }

                return locations;
            }

            /**
             * 获取数据并渲染
             */
            function getRegionData(){
                $.ajax({
                    url : opts.dataUrl,
                    dataType : 'json',
                    success : function(data){
                        regionData = data;
                        locations  = parseCurRegion(opts.regionValue);
                        //隐藏该表单
                        _this.hide();
                        var lct_len   = locations.length;
                        for(var i = 0; i < lct_len; i++){
                            _region     = queryOne(locations[i]);
                            sltArray[i] = generateSelector(_region['parentId'],i,locations[i]);
                            if(opts.wrapJqDom){
                                var $wrapDom  = opts.wrapJqDom.clone();
                                $wrapDom.append(sltArray[i]);
                                $parent.append($wrapDom);

                            }else{
                                $parent.append(sltArray[i]);
                            }

                            if($.inArray(i,opts.showLevel) == -1){
                                sltArray[i].hide();
                            }
                        }
                        //遍历所有的选择器,添加事件
                        $.each(sltArray,function(idx,_slt){
                            //不是最后一个选择,需要联动
                            if(idx < sltArray.length -1){
                                _slt.on('change',function(){
                                    var $_nextSelect = sltArray[idx + 1];
                                    $_nextSelect.empty();
                                    var _nextSelectLists = queryLists($(this).val(),idx +1);
                                    $_nextSelect     = generateOptions($_nextSelect,_nextSelectLists,'',idx + 1);
                                    $_nextSelect.trigger('change');
                                    computeRegionValue()
                                });
                            }
                        });

                    }
                });
            }

            /**
             * 查询数据库,仅限查下一级
             * @param int pid
             * @param int type
             */
            function queryLists(pid,type){
                var len = regionData.length;
                var _tmpArray = [];
                if( isNaN( parseInt(pid) )){
                    return _tmpArray;
                }

                for(var i = 0; i < len; i++){

                    var isHasType = isNumeric(type) ? (regionData[i]['regionType'] == type ? true : false) : true;
                    if(regionData[i]['parentId'] == pid && isHasType){
                        _tmpArray.push(regionData[i]);
                    }
                }
                return _tmpArray;
            }

            /**
             * 查询地区信息
             * @param rid
             * @param type
             * @returns {*}
             */
            function queryOne(rid,type){
                var len = regionData.length;
                var _tmpArray = [];
                if( isNaN( parseInt(rid) )){
                    return _tmpArray;
                }

                for(var i = 0; i < len; i++){
                    var isHasType = isNumeric(type) ? (regionData[i]['regionType'] == type ? true : false) : true;
                    if(regionData[i]['regionId'] == rid && isHasType){
                        return regionData[i];
                    }
                }
                return _tmpArray;
            }

            /**
             * 生成选择器
             * @param int pid
             * @param int type
             * @return jquery Dom
             */
            function generateSelector(pid,type,onValue){
                var $select = $('<select></select>');
                var lists   = queryLists(pid);

                $select     = generateOptions($select,lists,onValue,type);

                if(opts.class_name && opts.class_name != ''){
                    $select.addClass(opts.class_name);
                }


                return $select;
            }


            /**
             * 生成选择项
             * @param $select
             * @param data
             * @param onValue
             * @returns {*}
             */
            function generateOptions($select,data,onValue){

                if(isNumeric(arguments[3])){
                    type = arguments[3];
                    //添加默认选项
                    if(typeof opts.defaultOpts[type] == 'object'){
                        var $option = $('<option></option>');
                        $option.val(opts.defaultOpts[type]['value']).html(opts.defaultOpts[type]['name']);
                        $select.append($option);
                    }
                }

                $.each(data,function(index,optionData){
                    var $option = $('<option></option>');
                    if(onValue == optionData['regionId']){
                        $option.attr('selected','selected');
                    }
                    $option.val(optionData['regionId']).html(optionData['regionName']);
                    $select.append($option);
                });
                return $select;
            }

            function isNumeric(value){
                return typeof value == 'number' ? true : false;
            }

            function getValue(){
                if(_this.is('input') || _this.is('textarea')){
                    return _this.val();
                }else{
                    return _this.attr(opts.val_attr);
                }
            }

            function setValue(value){


                if( _this.is('input') || _this.is('textarea') ){
                    _this.val(value);
                    return;
                }else{
                    _this.attr(opts.val_attr,value);
                    return;
                }
            }

            generateRegionView();

            function computeRegionValue (){
                var regions = [];
                //遍历,将值推进数组
                $.each(sltArray,function(idx,_slt){
                    regions.push($(this).val());
                });

                setValue(regions.join('-'));
            };

        });


        return $(this);
    }
})(jQuery);