export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image_file') as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: '没有提供图片文件' },
        { status: 400 }
      );
    }

    // Prepare form data for remove.bg API
    const removeBgFormData = new FormData();
    removeBgFormData.append('image_file', imageFile);
    removeBgFormData.append('size', 'auto');

    // Call remove.bg API
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.REMOVE_BG_API_KEY || 'TwdgrsLWEp8kfBjThvgizJmv',
      },
      body: removeBgFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('remove.bg API error:', errorText);

      let errorMessage = '移除背景失败，请重试';
      if (response.status === 402) {
        errorMessage = 'API 额度已用完，请稍后再试';
      } else if (response.status === 403) {
        errorMessage = 'API Key 无效，请检查配置';
      } else if (response.status === 400) {
        errorMessage = '请求无效，图片可能有问题';
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // The response is the binary image data
    const imageBlob = await response.blob();

    // Return the image directly
    return new NextResponse(imageBlob, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Error in remove-bg route:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
